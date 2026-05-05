import { extname } from "node:path";

import { type IFileParser, type ParsedFileResult } from "@/application/ports/IFileParser";
import { FileParsingError } from "@/infrastructure/parsers/errors/FileParsingError";
import { DiabetesParser } from "@/infrastructure/parsers/DiabetesParser";
import { HypertensionParser } from "@/infrastructure/parsers/HypertensionParser";
import * as XLSX from "xlsx";

type MatrixRow = string[];
type RawRecord = Record<string, string>;

const SUPPORTED_EXTENSIONS = new Set([".csv", ".xls", ".xlsx"]);
const MAX_TITLE_SCAN_ROWS = 8;

export class SheetJSFileParser implements IFileParser {
  async parse(buffer: Buffer, fileName: string): Promise<ParsedFileResult> {
    this.validateFileExtension(fileName);

    const matrix = this.readMatrix(buffer, fileName);
    const condition = this.detectCondition(matrix, fileName);
    const parser = condition === "DIABETES" ? new DiabetesParser() : new HypertensionParser();
    const records = this.extractRecords(matrix);

    parser.validateHeaders(Object.keys(records[0] ?? {}));

    return {
      condition,
      records: parser.parse(records),
    };
  }

  private validateFileExtension(fileName: string): void {
    const extension = extname(fileName).toLowerCase();

    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      throw new FileParsingError("Formato de arquivo nao suportado para importacao.");
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
      throw new FileParsingError("Arquivo sem abas ou conteudo legivel.");
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

  private detectCondition(matrix: MatrixRow[], fileName: string): ParsedFileResult["condition"] {
    const titleSample = matrix
      .slice(0, MAX_TITLE_SCAN_ROWS)
      .flat()
      .join(" ");
    const normalizedTitle = this.normalize(titleSample || fileName);

    if (normalizedTitle.includes("diabetes")) {
      return "DIABETES";
    }

    if (normalizedTitle.includes("hipertens")) {
      return "HYPERTENSION";
    }

    throw new FileParsingError("Nao foi possivel identificar se o relatorio e de diabetes ou hipertensao.");
  }

  private extractRecords(matrix: MatrixRow[]): RawRecord[] {
    const headerRowIndex = matrix.findIndex((row) => this.isHeaderRow(row));

    if (headerRowIndex === -1) {
      throw new FileParsingError("Nao foi possivel localizar a linha de cabecalho do relatorio.");
    }

    const headers = matrix[headerRowIndex].map((header) => header.trim());
    const dataRows = matrix.slice(headerRowIndex + 1).filter((row) => row.some((cell) => cell.trim() !== ""));

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
      normalizedCells.some((cell) => cell.includes("atend") || cell.includes("pressao"))
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
