import { type AgeGroup } from "@/domain/value-objects/AgeGroup";
import { type Condition } from "@/domain/value-objects/Condition";

export type CareGapFilter =
  | "medical"
  | "nursing"
  | "home-visit"
  | "blood-pressure"
  | "hba1c";

export interface DashboardFiltersDTO {
  condition: Condition | "ALL";
  sex: string | null;
  raceColor: string | null;
  neighborhood: string | null;
  familyAllowance: "ALL" | "YES" | "NO";
  ageGroup: AgeGroup | "ALL";
  careGap: CareGapFilter | null;
}
