import { type Condicao } from "@/domain/value-objects/Condicao";
import { BaseConditionParser } from "@/infrastructure/parsers/BaseConditionParser";

const HBA1C_ALIASES = [
  "meses ultima hba1c",
  "meses sem hba1c",
  "tempo sem hba1c",
  "tempo sem hemoglobina glicada",
] as const;

export class DiabetesParser extends BaseConditionParser {
  readonly condicao: Condicao = "DIABETES";

  protected getConditionSpecificMonths(row: Record<string, string>): number | null {
    return this.readIntegerValue(row, HBA1C_ALIASES);
  }
}
