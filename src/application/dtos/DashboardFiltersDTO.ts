import { type AgeGroup } from "@/domain/value-objects/AgeGroup";
import { type Condition } from "@/domain/value-objects/Condition";

export type CareGapFilter =
  | "medical"
  | "nursing"
  | "home-visit"
  | "blood-pressure"
  | "hba1c";

export interface DashboardFiltersDTO {
  conditions: Condition[];
  sexes: string[];
  raceColors: string[];
  neighborhoods: string[];
  familyAllowances: Array<"YES" | "NO" | "UNKNOWN">;
  ageGroups: AgeGroup[];
  careGaps: CareGapFilter[];
}
