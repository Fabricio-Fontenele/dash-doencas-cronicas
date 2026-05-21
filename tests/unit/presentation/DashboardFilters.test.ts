import { describe, expect, it } from "vitest";

import {
  createDashboardQueryString,
  parseDashboardFilters,
  removeDashboardFilterValue,
} from "@/presentation/dashboard/filters";

describe("Dashboard filter helpers", () => {
  it("parses valid multi-select filters from search params", () => {
    const filters = parseDashboardFilters({
      sex: ["F", "M"],
      raceColor: "Parda",
      neighborhood: ["Centro", "Bela Vista"],
      familyAllowance: ["YES", "UNKNOWN"],
      ageGroup: ["60-79", "80+", "invalid"],
      careGap: ["medical", "hba1c", "dental", "bad-value"],
      profession: ["MEDICAL", "HOME_VISIT", "OTHER"],
      timePreset: "CUSTOM",
      startDate: "2026-01-01",
      endDate: "2026-05-01",
      condition: ["DIABETES", "HYPERTENSION", "OTHER"],
    });

    expect(filters).toEqual({
      conditions: ["DIABETES", "HYPERTENSION"],
      sexes: ["F", "M"],
      raceColors: ["Parda"],
      neighborhoods: ["Centro", "Bela Vista"],
      familyAllowances: ["YES", "UNKNOWN"],
      ageGroups: ["60-79", "80+"],
      careGaps: ["medical", "hba1c", "dental"],
      professions: ["MEDICAL", "HOME_VISIT"],
      timePreset: "CUSTOM",
      startDate: "2026-01-01",
      endDate: "2026-05-01",
    });
  });

  it("serializes filters to a stable query string", () => {
    const query = createDashboardQueryString({
      conditions: ["DIABETES"],
      sexes: ["F"],
      raceColors: ["Parda"],
      neighborhoods: ["Centro"],
      familyAllowances: ["NO"],
      ageGroups: ["60-79"],
      careGaps: ["medical"],
      professions: ["MEDICAL"],
      timePreset: "LAST_6_MONTHS",
      startDate: null,
      endDate: null,
    });

    expect(query).toBe(
      "/?condition=DIABETES&sex=F&raceColor=Parda&neighborhood=Centro&familyAllowance=NO&ageGroup=60-79&careGap=medical&profession=MEDICAL&timePreset=LAST_6_MONTHS",
    );
  });

  it("removes a single filter value without mutating the others", () => {
    const updatedFilters = removeDashboardFilterValue(
      {
        conditions: [],
        sexes: ["F", "M"],
        raceColors: [],
        neighborhoods: ["Centro"],
        familyAllowances: [],
        ageGroups: ["60-79"],
        careGaps: ["medical"],
        professions: [],
        timePreset: "LAST_6_MONTHS",
        startDate: null,
        endDate: null,
      },
      "sexes",
      "F",
    );

    expect(updatedFilters).toEqual({
      conditions: [],
      sexes: ["M"],
      raceColors: [],
      neighborhoods: ["Centro"],
      familyAllowances: [],
      ageGroups: ["60-79"],
      careGaps: ["medical"],
      professions: [],
      timePreset: "LAST_6_MONTHS",
      startDate: null,
      endDate: null,
    });
  });
});
