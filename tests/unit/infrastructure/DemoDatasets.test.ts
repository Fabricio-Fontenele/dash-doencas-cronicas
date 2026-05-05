import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { SheetJSFileParser } from "@/infrastructure/parsers/SheetJSFileParser";

const datasetsDirectory = path.resolve("datasets");

describe("Demo datasets", () => {
  it("parseia o dataset de diabetes com 100 registros", async () => {
    const parser = new SheetJSFileParser();
    const fileName = "Relatório de acompanhamento diabetes.csv.xls";
    const buffer = fs.readFileSync(path.join(datasetsDirectory, fileName));

    const result = await parser.parse(buffer, fileName);

    expect(result.condicao).toBe("DIABETES");
    expect(result.pacientes).toHaveLength(100);
    expect(result.pacientes[0]?.toJSON()).toMatchObject({
      id: "DBT-001",
      condicao: "DIABETES",
    });
  });

  it("parseia o dataset de hipertensao com 100 registros", async () => {
    const parser = new SheetJSFileParser();
    const fileName = "Relatório acompanhamento hipertensão.csv.xls";
    const buffer = fs.readFileSync(path.join(datasetsDirectory, fileName));

    const result = await parser.parse(buffer, fileName);

    expect(result.condicao).toBe("HIPERTENSAO");
    expect(result.pacientes).toHaveLength(100);
    expect(result.pacientes[0]?.toJSON()).toMatchObject({
      id: "HIP-001",
      condicao: "HIPERTENSAO",
    });
  });
});
