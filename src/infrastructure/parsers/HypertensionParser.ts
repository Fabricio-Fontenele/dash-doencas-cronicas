import { type ClinicalCondition } from "@/domain/value-objects/Condition";
import { BaseConditionParser } from "@/infrastructure/parsers/BaseConditionParser";

export class HypertensionParser extends BaseConditionParser {
  readonly condition: ClinicalCondition = "HYPERTENSION";

  protected getConditionSpecificMonths(): number | null {
    return null;
  }
}
