import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import { FileParsingError } from "@/infrastructure/parsers/errors/FileParsingError";
import { SheetJSFileParser } from "@/infrastructure/parsers/SheetJSFileParser";

function makeXlsxBuffer(rows: string[][]): Buffer {
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Relatorio");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

describe("SheetJSFileParser", () => {
  it("detecta diabetes em CSV latin1 e cria registros anonimos", async () => {
    const parser = new SheetJSFileParser();
    const csv = [
      "Relatorio de acompanhamento - Diabetes",
      "ID;Nome;Idade;Sexo;Bairro;Meses ultimo atend medico;Meses ultimo atend enfermagem;Meses ultima visita domiciliar;Meses ultima medicao pressao arterial;Meses ultima HbA1c",
      "1;João da Silva;65;M;Centro;7;4;2;8;14",
    ].join("\n");

    const result = await parser.parse(Buffer.from(csv, "latin1"), "diabetes.csv");

    expect(result.condition).toBe("DIABETES");
    expect(result.records).toHaveLength(1);
    expect(result.records[0]?.ageGroup).toBe("60-79");
    expect(result.records[0]?.hasStaleHbA1c).toBe(true);
  });

  it("detecta hipertensao em XLSX e ignora HbA1c", async () => {
    const parser = new SheetJSFileParser();
    const buffer = makeXlsxBuffer([
      ["Relatorio de acompanhamento - Hipertensao"],
      [
        "Codigo",
        "Nome",
        "Idade",
        "Sexo",
        "Bairro",
        "Meses ultimo atend medico",
        "Meses ultimo atend enfermagem",
        "Meses ultima visita domiciliar",
        "Meses ultima medicao pressao arterial",
      ],
      ["ABC-10", "Maria Souza", "72", "F", "Bela Vista", "3", "9", "5", "7"],
    ]);

    const result = await parser.parse(buffer, "hipertensao.xlsx");

    expect(result.condition).toBe("HYPERTENSION");
    expect(result.records).toHaveLength(1);
    expect(result.records[0]?.hasStaleHbA1c).toBe(false);
  });

  it("falha quando o cabecalho obrigatorio nao existe", async () => {
    const parser = new SheetJSFileParser();
    const csv = ["Relatorio de acompanhamento - Diabetes", "Paciente;Idade", "Maria;40"].join("\n");

    await expect(parser.parse(Buffer.from(csv), "invalido.csv")).rejects.toThrow(FileParsingError);
  });
});
