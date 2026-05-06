import { type Condition } from "@/domain/value-objects/Condition";
import { BaseConditionParser } from "@/infrastructure/parsers/BaseConditionParser";

const HBA1C_ALIASES = [
  "meses ultima hba1c",
  "meses sem hba1c",
  "tempo sem hba1c",
  "tempo sem hemoglobina glicada",
] as const;

const HBA1C_DATE_ALIASES = [
  "data da ultima avaliacao de hemoglobina glicada",
  "data da ultima solicitacao de hemoglobina glicada",
] as const;

export class DiabetesParser extends BaseConditionParser {
  readonly condition: Condition = "DIABETES";

  protected getConditionSpecificMonths(row: Record<string, string>): number | null {
    return (
      this.readIntegerValue(row, HBA1C_ALIASES) ??
      this.readMonthsFromDateValue(row, HBA1C_DATE_ALIASES)
    );
  }
}
