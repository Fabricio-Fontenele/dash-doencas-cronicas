import { extname } from "node:path";

import { type IFileParser, type ParsedFileResult } from "@/application/ports/IFileParser";
import { type ClinicalCondition } from "@/domain/value-objects/Condition";
import { FileParsingError } from "@/infrastructure/parsers/errors/FileParsingError";
import { DiabetesParser } from "@/infrastructure/parsers/DiabetesParser";
import { HypertensionParser } from "@/infrastructure/parsers/HypertensionParser";
import * as XLSX from "xlsx";

type MatrixRow = string[];
type RawRecord = Record<string, string>;

const SUPPORTED_EXTENSIONS = new Set([".csv", ".xls", ".xlsx"]);
const MAX_TITLE_SCAN_ROWS = 8;
const CONDITION_HEADER_ALIASES = [
  "condicao",
  "condição",
  "linha de cuidado",
  "tipo de acompanhamento",
  "agravo",
  "problema",
  "classificacao",
  "classificação",
];
const DIABETES_ROW_ALIASES = [
  "hemoglobina glicada",
  "hba1c",
  "diabetes",
  "diabetico",
  "diabético",
];

export class SheetJSFileParser implements IFileParser {
  async parse(buffer: Buffer, fileName: string): Promise<ParsedFileResult> {
    this.validateFileExtension(fileName);

    const matrix = this.readMatrix(buffer, fileName);
    const fileCondition = this.detectFileCondition(matrix, fileName);
    const records = this.extractRecords(matrix);
    const diabetesParser = new DiabetesParser();
    const hypertensionParser = new HypertensionParser();

    hypertensionParser.validateHeaders(Object.keys(records[0] ?? {}));

    const parsedRecords = records.map((row, index) => {
      const rowCondition = this.detectRowCondition(row, fileCondition);

      if (rowCondition === "DIABETES") {
        return diabetesParser.parseRow(row);
      }

      if (rowCondition === "HYPERTENSION") {
        return hypertensionParser.parseRow(row);
      }

      throw new FileParsingError(
        `Não foi possível identificar a condição clínica da linha ${index + 1} no arquivo misto.`,
      );
    });

    const conditionSet = new Set(parsedRecords.map((record) => record.condition));
    const uploadCondition =
      conditionSet.size > 1
        ? "MIXED"
        : (parsedRecords[0]?.condition ?? fileCondition);

    return {
      condition: uploadCondition,
      records: parsedRecords,
      capabilities: diabetesParser.getCapabilities(parsedRecords),
    };
  }

  private validateFileExtension(fileName: string): void {
    const extension = extname(fileName).toLowerCase();

    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      throw new FileParsingError("Formato de arquivo não suportado para importação.");
    }
  }

  private readMatrix(buffer: Buffer, fileName: string): MatrixRow[] {
    const extension = extname(fileName).toLowerCase();
    const workbook =
      extension === ".csv"
        ? XLSX.read(this.decodeCsvBuffer(buffer), { type: "string", FS: ";" })
        : XLSX.read(buffer, { type: "buffer" });

    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new FileParsingError("Arquivo sem abas ou conteúdo legível.");
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
    });

    return rows.map((row) => row.map((cell) => String(cell).trim()));
  }

  private decodeCsvBuffer(buffer: Buffer): string {
    const utf8Decoded = new TextDecoder("utf-8").decode(buffer);
    return utf8Decoded.includes("�") ? new TextDecoder("latin1").decode(buffer) : utf8Decoded;
  }

  private detectFileCondition(matrix: MatrixRow[], fileName: string): ParsedFileResult["condition"] {
    const titleSample = matrix.slice(0, MAX_TITLE_SCAN_ROWS).flat().join(" ");
    const normalizedTitle = this.normalize(titleSample || fileName);
    const mentionsDiabetes = normalizedTitle.includes("diabetes");
    const mentionsHypertension = normalizedTitle.includes("hipertens");

    if (mentionsDiabetes && mentionsHypertension) {
      return "MIXED";
    }

    if (mentionsDiabetes) {
      return "DIABETES";
    }

    if (mentionsHypertension) {
      return "HYPERTENSION";
    }

    return "MIXED";
  }

  private detectRowCondition(
    row: RawRecord,
    fileCondition: ParsedFileResult["condition"],
  ): ClinicalCondition | null {
    const explicitCondition = this.readExplicitCondition(row);

    if (explicitCondition) {
      return explicitCondition;
    }

    if (this.hasDiabetesMarkers(row)) {
      return "DIABETES";
    }

    if (fileCondition === "DIABETES" || fileCondition === "HYPERTENSION") {
      return fileCondition;
    }

    return null;
  }

  private readExplicitCondition(row: RawRecord): ClinicalCondition | null {
    const conditionHeader = Object.keys(row).find((header) =>
      CONDITION_HEADER_ALIASES.some((alias) => this.normalize(alias) === this.normalize(header)),
    );

    if (!conditionHeader) {
      return null;
    }

    const rawValue = row[conditionHeader]?.trim();

    if (!rawValue) {
      return null;
    }

    const normalizedValue = this.normalize(rawValue);

    if (normalizedValue.includes("diabet")) {
      return "DIABETES";
    }

    if (normalizedValue.includes("hipertens")) {
      return "HYPERTENSION";
    }

    return null;
  }

  private hasDiabetesMarkers(row: RawRecord): boolean {
    return Object.entries(row).some(([header, value]) => {
      const normalizedHeader = this.normalize(header);
      const normalizedValue = this.normalize(value);

      return (
        value.trim() !== "" &&
        DIABETES_ROW_ALIASES.some(
          (alias) =>
            normalizedHeader.includes(this.normalize(alias)) ||
            normalizedValue.includes(this.normalize(alias)),
        )
      );
    });
  }

  private extractRecords(matrix: MatrixRow[]): RawRecord[] {
    const headerRowIndex = matrix.findIndex((row) => this.isHeaderRow(row));

    if (headerRowIndex === -1) {
      throw new FileParsingError("Não foi possível localizar a linha de cabeçalho do relatório.");
    }

    const headers = matrix[headerRowIndex].map((header) => header.trim());
    const dataRows = matrix
      .slice(headerRowIndex + 1)
      .filter((row) => row.some((cell) => cell.trim() !== ""));

    return dataRows.map((row) =>
      headers.reduce<RawRecord>((record, header, index) => {
        if (header) {
          record[header] = row[index]?.trim() ?? "";
        }

        return record;
      }, {}),
    );
  }

  private isHeaderRow(row: MatrixRow): boolean {
    const normalizedCells = row.map((cell) => this.normalize(cell));
    return (
      normalizedCells.some((cell) => cell === "bairro" || cell === "microarea") &&
      normalizedCells.some(
        (cell) =>
          cell.includes("atend") ||
          cell.includes("pressao") ||
          cell.includes("condicao"),
      )
    );
  }

  private normalize(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }
}
