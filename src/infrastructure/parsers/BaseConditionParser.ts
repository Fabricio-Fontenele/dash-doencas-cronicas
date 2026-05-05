import { Paciente } from "@/domain/entities/Paciente";
import { type Condicao } from "@/domain/value-objects/Condicao";
import { FileParsingError } from "@/infrastructure/parsers/errors/FileParsingError";

type RawRecord = Record<string, string>;

const EMPTY_TOKENS = new Set(["", "-", "--", "na", "n/a", "ni", "nao informado"]);

const COMMON_FIELD_ALIASES = {
  id: ["id", "codigo", "codigo do paciente", "codigo do cidadao", "id paciente"],
  nome: ["nome", "nome do paciente", "paciente"],
  idade: ["idade"],
  sexo: ["sexo"],
  bairro: ["bairro", "microarea", "bairro microarea"],
  mesesUltimoAtendMedico: [
    "meses ultimo atend medico",
    "meses sem atendimento medico",
    "tempo sem atendimento medico",
  ],
  mesesUltimoAtendEnfermagem: [
    "meses ultimo atend enfermagem",
    "meses sem atendimento enfermagem",
    "tempo sem atendimento enfermagem",
  ],
  mesesUltimaVisitaDomiciliar: [
    "meses ultima visita domiciliar",
    "meses sem visita domiciliar",
    "tempo sem visita domiciliar",
  ],
  mesesUltimaMedicaoPressaoArterial: [
    "meses ultima medicao pressao arterial",
    "meses sem medicao de pa",
    "tempo sem medicao de pa",
    "tempo sem pressao arterial",
  ],
} as const;

export abstract class BaseConditionParser {
  abstract readonly condicao: Condicao;

  parse(rows: RawRecord[]): Paciente[] {
    if (rows.length === 0) {
      throw new FileParsingError("O arquivo nao possui linhas de pacientes para importar.");
    }

    return rows.map((row) => this.toPaciente(row));
  }

  validateHeaders(headers: string[]): void {
    const requiredFields = ["id", "nome"] as const;
    const hasAllRequiredFields = requiredFields.every((field) =>
      this.findHeaderValue(headers, COMMON_FIELD_ALIASES[field]),
    );

    if (!hasAllRequiredFields) {
      throw new FileParsingError("Colunas obrigatorias ausentes no relatorio importado.");
    }
  }

  protected abstract getConditionSpecificMonths(row: RawRecord): number | null;

  private toPaciente(row: RawRecord): Paciente {
    const externalId = this.readRequiredValue(row, COMMON_FIELD_ALIASES.id, "identificador");
    const nome = this.readRequiredValue(row, COMMON_FIELD_ALIASES.nome, "nome");

    return Paciente.create({
      id: externalId,
      nome,
      condicao: this.condicao,
      idade: this.readIntegerValue(row, COMMON_FIELD_ALIASES.idade),
      sexo: this.readOptionalValue(row, COMMON_FIELD_ALIASES.sexo),
      bairro: this.readOptionalValue(row, COMMON_FIELD_ALIASES.bairro),
      mesesUltimoAtendMedico: this.readIntegerValue(row, COMMON_FIELD_ALIASES.mesesUltimoAtendMedico),
      mesesUltimoAtendEnfermagem: this.readIntegerValue(
        row,
        COMMON_FIELD_ALIASES.mesesUltimoAtendEnfermagem,
      ),
      mesesUltimaVisitaDomiciliar: this.readIntegerValue(
        row,
        COMMON_FIELD_ALIASES.mesesUltimaVisitaDomiciliar,
      ),
      mesesUltimaMedicaoPressaoArterial: this.readIntegerValue(
        row,
        COMMON_FIELD_ALIASES.mesesUltimaMedicaoPressaoArterial,
      ),
      mesesUltimaHbA1c: this.getConditionSpecificMonths(row),
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

  protected readOptionalValue(row: RawRecord, aliases: readonly string[]): string | null {
    const value = this.findHeaderValue(Object.keys(row), aliases);

    if (!value) {
      return null;
    }

    const normalized = row[value]?.trim() ?? "";
    return EMPTY_TOKENS.has(this.normalizeValue(normalized)) ? null : normalized;
  }

  private readRequiredValue(row: RawRecord, aliases: readonly string[], fieldName: string): string {
    const value = this.readOptionalValue(row, aliases);

    if (!value) {
      throw new FileParsingError(`Linha invalida no relatorio: campo obrigatorio ausente (${fieldName}).`);
    }

    return value;
  }

  private findHeaderValue(headers: readonly string[], aliases: readonly string[]): string | null {
    const aliasSet = new Set(aliases.map((alias) => this.normalizeValue(alias)));
    return headers.find((header) => aliasSet.has(this.normalizeValue(header))) ?? null;
  }

  private normalizeValue(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }
}
