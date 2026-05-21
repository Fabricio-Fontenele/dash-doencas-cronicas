import { type AgeGroup } from "@/domain/value-objects/AgeGroup";
import { type Condition } from "@/domain/value-objects/Condition";
import { type TimelineProfession } from "@/domain/value-objects/Profession";
import { type TimeRangePreset } from "@/domain/value-objects/TimeRangePreset";

export type CareGapFilter =
  | "medical"
  | "nursing"
  | "dental"
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
  professions: TimelineProfession[];
  timePreset: TimeRangePreset;
  startDate: string | null;
  endDate: string | null;
}
