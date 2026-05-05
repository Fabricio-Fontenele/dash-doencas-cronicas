import { type Condition } from "@/domain/value-objects/Condition";
import { BaseConditionParser } from "@/infrastructure/parsers/BaseConditionParser";

export class HypertensionParser extends BaseConditionParser {
  readonly condition: Condition = "HYPERTENSION";

  protected getConditionSpecificMonths(): number | null {
    return null;
  }
}
