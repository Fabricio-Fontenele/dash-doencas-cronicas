import {
  type CareGapFilter,
  type DashboardFiltersDTO,
} from "@/application/dtos/DashboardFiltersDTO";
import { AGE_GROUPS } from "@/domain/value-objects/AgeGroup";

type SearchParamValue = string | string[] | undefined;

export interface DashboardSearchParams {
  [key: string]: SearchParamValue;
}

function parseMultiValue(value: SearchParamValue): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (!value) {
    return [];
  }

  return [value];
}

export function parseDashboardFilters(
  searchParams: DashboardSearchParams,
): DashboardFiltersDTO {
  const conditions = parseMultiValue(searchParams.condition).filter(
    (value): value is "DIABETES" | "HYPERTENSION" =>
      value === "DIABETES" || value === "HYPERTENSION",
  );
  const familyAllowances = parseMultiValue(searchParams.familyAllowance).filter(
    (value): value is "YES" | "NO" | "UNKNOWN" =>
      value === "YES" || value === "NO" || value === "UNKNOWN",
  );
  const ageGroups = parseMultiValue(searchParams.ageGroup).filter(
    (value): value is (typeof AGE_GROUPS)[number] =>
      AGE_GROUPS.includes(value as (typeof AGE_GROUPS)[number]),
  );
  const careGaps = parseMultiValue(searchParams.careGap).filter(
    (value): value is CareGapFilter =>
      value === "medical" ||
      value === "nursing" ||
      value === "home-visit" ||
      value === "blood-pressure" ||
      value === "hba1c",
  );

  return {
    conditions,
    sexes: parseMultiValue(searchParams.sex),
    raceColors: parseMultiValue(searchParams.raceColor),
    neighborhoods: parseMultiValue(searchParams.neighborhood),
    familyAllowances,
    ageGroups,
    careGaps,
  };
}

export function createDashboardQueryString(filters: DashboardFiltersDTO): string {
  const params = new URLSearchParams();

  for (const condition of filters.conditions) params.append("condition", condition);
  for (const sex of filters.sexes) params.append("sex", sex);
  for (const raceColor of filters.raceColors) params.append("raceColor", raceColor);
  for (const neighborhood of filters.neighborhoods) {
    params.append("neighborhood", neighborhood);
  }
  for (const familyAllowance of filters.familyAllowances) {
    params.append("familyAllowance", familyAllowance);
  }
  for (const ageGroup of filters.ageGroups) params.append("ageGroup", ageGroup);
  for (const careGap of filters.careGaps) params.append("careGap", careGap);

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function removeDashboardFilterValue(
  filters: DashboardFiltersDTO,
  key: keyof DashboardFiltersDTO,
  value: string,
): DashboardFiltersDTO {
  return {
    ...filters,
    [key]: filters[key].filter((currentValue) => currentValue !== value),
  } as DashboardFiltersDTO;
}
