import { type Condicao } from "@/domain/value-objects/Condicao";
import { BaseConditionParser } from "@/infrastructure/parsers/BaseConditionParser";

export class HipertensaoParser extends BaseConditionParser {
  readonly condicao: Condicao = "HIPERTENSAO";

  protected getConditionSpecificMonths(): number | null {
    return null;
  }
}
