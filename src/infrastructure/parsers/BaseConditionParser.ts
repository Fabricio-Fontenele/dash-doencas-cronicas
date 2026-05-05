import { CareRecord } from "@/domain/entities/CareRecord";
import { type Condition } from "@/domain/value-objects/Condition";
import { FileParsingError } from "@/infrastructure/parsers/errors/FileParsingError";

type RawRecord = Record<string, string>;

const EMPTY_TOKENS = new Set(["", "-", "--", "na", "n/a", "ni", "nao informado"]);

const COMMON_FIELD_ALIASES = {
  age: ["idade"],
  sex: ["sexo"],
  raceColor: ["raca cor", "raça cor", "raca/cor", "raça/cor"],
  familyAllowance: [
    "beneficiario programa bolsa familia",
    "beneficiário programa bolsa família",
    "bolsa familia",
    "bolsa família",
  ],
  neighborhood: ["bairro", "microarea", "bairro microarea"],
  monthsSinceMedicalAppointment: [
    "meses ultimo atend medico",
    "meses sem atendimento medico",
    "tempo sem atendimento medico",
  ],
  monthsSinceNursingAppointment: [
    "meses ultimo atend enfermagem",
    "meses sem atendimento enfermagem",
    "tempo sem atendimento enfermagem",
  ],
  monthsSinceHomeVisit: [
    "meses ultima visita domiciliar",
    "meses sem visita domiciliar",
    "tempo sem visita domiciliar",
  ],
  monthsSinceBloodPressureCheck: [
    "meses ultima medicao pressao arterial",
    "meses sem medicao de pa",
    "tempo sem medicao de pa",
    "tempo sem pressao arterial",
  ],
} as const;

export abstract class BaseConditionParser {
  abstract readonly condition: Condition;

  parse(rows: RawRecord[]): CareRecord[] {
    if (rows.length === 0) {
      throw new FileParsingError("O arquivo nao possui linhas validas para importar.");
    }

    return rows.map((row) => this.toCareRecord(row));
  }

  validateHeaders(headers: string[]): void {
    const requiredFields = [
      "monthsSinceMedicalAppointment",
      "monthsSinceNursingAppointment",
      "monthsSinceHomeVisit",
      "monthsSinceBloodPressureCheck",
    ] as const;
    const hasAllRequiredFields = requiredFields.every((field) =>
      this.findHeaderValue(headers, COMMON_FIELD_ALIASES[field]),
    );

    if (!hasAllRequiredFields) {
      throw new FileParsingError("Colunas obrigatorias ausentes no relatorio importado.");
    }
  }

  protected abstract getConditionSpecificMonths(row: RawRecord): number | null;

  private toCareRecord(row: RawRecord): CareRecord {
    return CareRecord.create({
      condition: this.condition,
      age: this.readIntegerValue(row, COMMON_FIELD_ALIASES.age),
      sex: this.readOptionalValue(row, COMMON_FIELD_ALIASES.sex),
      raceColor: this.readOptionalValue(row, COMMON_FIELD_ALIASES.raceColor),
      familyAllowance: this.readBooleanValue(row, COMMON_FIELD_ALIASES.familyAllowance),
      neighborhood: this.readOptionalValue(row, COMMON_FIELD_ALIASES.neighborhood),
      monthsSinceMedicalAppointment: this.readIntegerValue(
        row,
        COMMON_FIELD_ALIASES.monthsSinceMedicalAppointment,
      ),
      monthsSinceNursingAppointment: this.readIntegerValue(
        row,
        COMMON_FIELD_ALIASES.monthsSinceNursingAppointment,
      ),
      monthsSinceHomeVisit: this.readIntegerValue(
        row,
        COMMON_FIELD_ALIASES.monthsSinceHomeVisit,
      ),
      monthsSinceBloodPressureCheck: this.readIntegerValue(
        row,
        COMMON_FIELD_ALIASES.monthsSinceBloodPressureCheck,
      ),
      monthsSinceHbA1c: this.getConditionSpecificMonths(row),
    });
  }

  protected readIntegerValue(row: RawRecord, aliases: readonly string[]): number | null {
    const rawValue = this.readOptionalValue(row, aliases);

    if (rawValue === null) {
      return null;
    }

    const numericValue = Number.parseInt(rawValue.replace(/[^\d-]/g, ""), 10);
    return Number.isNaN(numericValue) ? null : numericValue;
  }

  protected readBooleanValue(row: RawRecord, aliases: readonly string[]): boolean | null {
    const rawValue = this.readOptionalValue(row, aliases);

    if (rawValue === null) {
      return null;
    }

    const normalized = this.normalizeValue(rawValue);

    if (["sim", "s", "true", "1"].includes(normalized)) {
      return true;
    }

    if (["nao", "n", "false", "0"].includes(normalized)) {
      return false;
    }

    return null;
  }

  protected readOptionalValue(row: RawRecord, aliases: readonly string[]): string | null {
    const value = this.findHeaderValue(Object.keys(row), aliases);

    if (!value) {
      return null;
    }

    const normalized = row[value]?.trim() ?? "";
    return EMPTY_TOKENS.has(this.normalizeValue(normalized)) ? null : normalized;
  }

  private findHeaderValue(headers: readonly string[], aliases: readonly string[]): string | null {
    const aliasSet = new Set(aliases.map((alias) => this.normalizeValue(alias)));
    return headers.find((header) => aliasSet.has(this.normalizeValue(header))) ?? null;
  }

  protected normalizeValue(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }
}
