import { type ParsedFileCapabilities } from "@/application/ports/IFileParser";
import { CareRecord } from "@/domain/entities/CareRecord";
import { type ClinicalCondition } from "@/domain/value-objects/Condition";
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
    "meses desde o ultimo atendimento medico",
  ],
  monthsSinceNursingAppointment: [
    "meses ultimo atend enfermagem",
    "meses sem atendimento enfermagem",
    "tempo sem atendimento enfermagem",
    "meses desde o ultimo atendimento de enfermagem",
  ],
  monthsSinceDentalAppointment: [
    "meses ultimo atendimento odontologico",
    "meses desde o ultimo atendimento odontologico",
    "meses sem atendimento odontologico",
    "tempo sem atendimento odontologico",
  ],
  monthsSinceHomeVisit: [
    "meses ultima visita domiciliar",
    "meses sem visita domiciliar",
    "tempo sem visita domiciliar",
    "meses desde a ultima visita domiciliar",
  ],
  monthsSinceBloodPressureCheck: [
    "meses ultima medicao pressao arterial",
    "meses sem medicao de pa",
    "tempo sem medicao de pa",
    "tempo sem pressao arterial",
  ],
  bloodPressureCheckDate: [
    "data da ultima medicao de pressao arterial",
  ],
  weight: ["ultimo peso", "ultima medicao de peso", "peso"],
  height: ["ultima altura", "ultima medicao de altura", "altura"],
  medicalAppointmentDate: ["data da ultima consulta", "data da ultima consulta medica"],
  nursingAppointmentDate: ["data da ultima consulta de enfermagem"],
  dentalAppointmentDate: ["data da ultima consulta odontologica", "data do ultimo atendimento odontologico"],
  latestHomeVisitDate: ["ultimas visitas domiciliares", "data da ultima visita domiciliar"],
  bloodPressureValue: ["ultima medicao de pressao arterial"],
} as const;

export abstract class BaseConditionParser {
  abstract readonly condition: ClinicalCondition;

  parse(rows: RawRecord[]): CareRecord[] {
    if (rows.length === 0) {
      throw new FileParsingError("O arquivo não possui linhas válidas para importar.");
    }

    return rows.map((row) => this.parseRow(row));
  }

  validateHeaders(headers: string[]): void {
    const hasAllRequiredFields =
      this.findHeaderValue(headers, COMMON_FIELD_ALIASES.monthsSinceMedicalAppointment) &&
      this.findHeaderValue(headers, COMMON_FIELD_ALIASES.monthsSinceNursingAppointment) &&
      this.findHeaderValue(headers, COMMON_FIELD_ALIASES.monthsSinceHomeVisit) &&
      (
        this.findHeaderValue(headers, COMMON_FIELD_ALIASES.monthsSinceBloodPressureCheck) ||
        this.findHeaderValue(headers, COMMON_FIELD_ALIASES.bloodPressureCheckDate)
      );

    if (!hasAllRequiredFields) {
      throw new FileParsingError("Colunas obrigatórias ausentes no relatório importado.");
    }
  }

  protected abstract getConditionSpecificMonths(row: RawRecord): number | null;

  getCapabilities(records: CareRecord[]): ParsedFileCapabilities {
    return {
      supportsMedicalTimeline: records.some((record) => record.medicalAppointmentDate !== null),
      supportsNursingTimeline: records.some((record) => record.nursingAppointmentDate !== null),
      supportsDentalTimeline: records.some((record) => record.dentalAppointmentDate !== null),
      supportsHomeVisitTimeline: records.some((record) => record.homeVisitDate !== null),
      supportsBmiClassification: records.some((record) => record.bmiClassification !== null),
      supportsBloodPressureClassification: records.some(
        (record) => record.bloodPressureClassification !== null,
      ),
      supportsHbA1cClassification: records.some((record) => record.hba1cClassification !== null),
    };
  }

  parseRow(row: RawRecord): CareRecord {
    const bloodPressure = this.readBloodPressureValue(row);

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
      monthsSinceDentalAppointment: this.readIntegerValue(
        row,
        COMMON_FIELD_ALIASES.monthsSinceDentalAppointment,
      ),
      monthsSinceHomeVisit: this.readIntegerValue(
        row,
        COMMON_FIELD_ALIASES.monthsSinceHomeVisit,
      ),
      monthsSinceBloodPressureCheck: this.readMonthsSinceBloodPressureCheck(row),
      monthsSinceHbA1c: this.getConditionSpecificMonths(row),
      medicalAppointmentDate: this.readDateValue(row, COMMON_FIELD_ALIASES.medicalAppointmentDate),
      nursingAppointmentDate: this.readDateValue(row, COMMON_FIELD_ALIASES.nursingAppointmentDate),
      dentalAppointmentDate: this.readDateValue(row, COMMON_FIELD_ALIASES.dentalAppointmentDate),
      homeVisitDate: this.readDateValue(row, COMMON_FIELD_ALIASES.latestHomeVisitDate),
      bloodPressureCheckDate: this.readDateValue(row, COMMON_FIELD_ALIASES.bloodPressureCheckDate),
      hba1cDate: this.getConditionSpecificDate(row),
      weightInKilograms: this.readDecimalValue(row, COMMON_FIELD_ALIASES.weight),
      heightInMeters: this.readDecimalValue(row, COMMON_FIELD_ALIASES.height),
      bloodPressureSystolic: bloodPressure?.systolic ?? null,
      bloodPressureDiastolic: bloodPressure?.diastolic ?? null,
      hba1cPercentage: this.getConditionSpecificMeasurement(row),
    });
  }

  protected readMonthsSinceBloodPressureCheck(row: RawRecord): number | null {
    const monthsValue = this.readIntegerValue(row, COMMON_FIELD_ALIASES.monthsSinceBloodPressureCheck);

    if (monthsValue !== null) {
      return monthsValue;
    }

    return this.readMonthsFromDateValue(row, COMMON_FIELD_ALIASES.bloodPressureCheckDate);
  }

  protected readIntegerValue(row: RawRecord, aliases: readonly string[]): number | null {
    const rawValue = this.readOptionalValue(row, aliases);

    if (rawValue === null) {
      return null;
    }

    const numericValue = Number.parseInt(rawValue.replace(/[^\d-]/g, ""), 10);
    return Number.isNaN(numericValue) ? null : numericValue;
  }

  protected readDecimalValue(row: RawRecord, aliases: readonly string[]): number | null {
    const rawValue = this.readOptionalValue(row, aliases);

    if (rawValue === null) {
      return null;
    }

    const normalized = rawValue.replace(",", ".").replace(/[^\d.]/g, "");
    const numericValue = Number.parseFloat(normalized);

    return Number.isNaN(numericValue) ? null : numericValue;
  }

  protected readMonthsFromDateValue(row: RawRecord, aliases: readonly string[]): number | null {
    const rawValue = this.readOptionalValue(row, aliases);

    if (rawValue === null) {
      return null;
    }

    const date = this.parseBrazilianDate(rawValue);

    if (date === null) {
      return null;
    }

    return this.calculateMonthDifference(date, new Date());
  }

  protected readDateValue(row: RawRecord, aliases: readonly string[]): Date | null {
    const rawValue = this.readOptionalValue(row, aliases);

    if (rawValue === null) {
      return null;
    }

    return this.parseBrazilianDate(rawValue);
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

    const normalized = row[value].trim();
    return EMPTY_TOKENS.has(this.normalizeValue(normalized)) ? null : normalized;
  }

  protected readBloodPressureValue(
    row: RawRecord,
  ): { systolic: number; diastolic: number } | null {
    const rawValue = this.readOptionalValue(row, COMMON_FIELD_ALIASES.bloodPressureValue);

    if (rawValue === null) {
      return null;
    }

    const match = rawValue.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);

    if (!match) {
      return null;
    }

    return {
      systolic: Number.parseInt(match[1], 10),
      diastolic: Number.parseInt(match[2], 10),
    };
  }

  protected getConditionSpecificDate(row: RawRecord): Date | null {
    void row;
    return null;
  }

  protected getConditionSpecificMeasurement(row: RawRecord): number | null {
    void row;
    return null;
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

  private parseBrazilianDate(value: string): Date | null {
    const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (!match) {
      return null;
    }

    const [, day, month, year] = match;
    const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate;
  }

  private calculateMonthDifference(from: Date, to: Date): number {
    const yearDifference = to.getFullYear() - from.getFullYear();
    const monthDifference = to.getMonth() - from.getMonth();
    let totalMonths = yearDifference * 12 + monthDifference;

    if (to.getDate() < from.getDate()) {
      totalMonths -= 1;
    }

    return Math.max(totalMonths, 0);
  }
}
