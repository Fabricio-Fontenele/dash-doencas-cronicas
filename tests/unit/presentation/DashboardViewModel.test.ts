import { describe, expect, it } from "vitest";

import { type DashboardViewDTO } from "@/application/dtos/DashboardViewDTO";
import { buildDashboardPageViewModel } from "@/presentation/dashboard/view-model";

function makeBaseView(): DashboardViewDTO {
  return {
    summary: {
      totalRecords: 10,
      withoutMedicalCare: 4,
      withoutNursingCare: 2,
      withoutDentalCare: 1,
      withoutHomeVisit: 3,
      withoutRecentBloodPressureCheck: 5,
      withoutRecentHbA1c: 1,
      totalDiabetes: 6,
      totalHypertension: 4,
    },
    filteredRecordCount: 10,
    periodLabel: "últimos 6 meses",
    conditionDistribution: [
      { label: "Diabetes", value: 6 },
      { label: "Hipertensão", value: 4 },
    ],
    topNeighborhoods: [{ label: "Centro", value: 6 }],
    ageGroupDistribution: [{ label: "60-79", value: 7 }],
    sexDistribution: [
      { label: "F", value: 6 },
      { label: "M", value: 4 },
    ],
    raceColorDistribution: [{ label: "Parda", value: 8 }],
    bmiDistribution: [{ label: "Sobrepeso", value: 4 }],
    bloodPressureDistribution: [{ label: "Hipertensão grau 1", value: 2 }],
    hba1cDistribution: [{ label: "HbA1c elevada", value: 3 }],
    careCoverage: [
      { label: "Atendimento médico em dia", covered: 6, uncovered: 4, coverageRate: 60 },
      { label: "Enfermagem em dia", covered: 8, uncovered: 2, coverageRate: 80 },
      { label: "Odontologia em dia", covered: 9, uncovered: 1, coverageRate: 90 },
      { label: "Visita domiciliar em dia", covered: 7, uncovered: 3, coverageRate: 70 },
      { label: "PA recente", covered: 5, uncovered: 5, coverageRate: 50 },
      { label: "HbA1c recente", covered: 9, uncovered: 1, coverageRate: 90 },
    ],
    careByProfessional: [],
    homeVisitTimeline: [],
    warnings: [],
    insights: [],
    filterOptions: {
      neighborhoods: ["Centro"],
      sexes: ["F", "M"],
      raceColors: ["Parda"],
      professions: ["MEDICAL", "NURSING", "DENTAL", "HOME_VISIT"],
    },
    appliedFilters: {
      conditions: [],
      sexes: ["F"],
      raceColors: [],
      neighborhoods: [],
      familyAllowances: ["YES"],
      ageGroups: ["60-79"],
      careGaps: ["medical"],
      professions: [],
      timePreset: "LAST_6_MONTHS",
      startDate: null,
      endDate: null,
    },
  };
}

describe("Dashboard page view model", () => {
  it("builds snapshot metadata, chips and chart items for mixed conditions", () => {
    const viewModel = buildDashboardPageViewModel(makeBaseView(), {
      id: "upload-1",
      fileName: "cronicos.xlsx",
      condition: "DIABETES",
      totalRecords: 10,
      supportsMedicalTimeline: true,
      supportsNursingTimeline: false,
      supportsDentalTimeline: false,
      supportsHomeVisitTimeline: true,
      supportsBmiClassification: true,
      supportsBloodPressureClassification: true,
      supportsHbA1cClassification: true,
      createdAt: new Date("2026-05-05T10:00:00Z"),
      uploadedBy: "Equipe UBS",
    });

    expect(viewModel.hasMixedConditions).toBe(true);
    expect(viewModel.conditionContextLabel).toBe("diabetes e hipertensão");
    expect(viewModel.snapshotTitle).toBe("cronicos.xlsx");
    expect(viewModel.snapshotDescription).toContain("Condição de origem: Diabetes");
    expect(viewModel.activeFilterChips.map((chip) => chip.label)).toEqual([
      "F",
      "60-79",
      "Bolsa Família: Sim",
      "Sem atendimento médico > 6 meses",
      "Últimos 6 meses",
    ]);
    expect(viewModel.sexChartItems).toEqual([
      { label: "Feminino", value: 6, color: "#e8531e" },
      { label: "Masculino", value: 4, color: "#143a60" },
    ]);
    expect(viewModel.narrative.title).toBe("Panorama integrado das linhas de cuidado");
  });

  it("removes HbA1c from coverage when the recorte has only hypertension", () => {
    const hypertensionOnlyView = {
      ...makeBaseView(),
      summary: {
        totalRecords: 4,
        withoutMedicalCare: 1,
        withoutNursingCare: 1,
        withoutDentalCare: 0,
        withoutHomeVisit: 1,
        withoutRecentBloodPressureCheck: 2,
        withoutRecentHbA1c: 0,
        totalDiabetes: 0,
        totalHypertension: 4,
      },
      conditionDistribution: [
        { label: "Diabetes", value: 0 },
        { label: "Hipertensão", value: 4 },
      ],
    } satisfies DashboardViewDTO;

    const viewModel = buildDashboardPageViewModel(hypertensionOnlyView, null);

    expect(viewModel.hasHypertension).toBe(true);
    expect(viewModel.hasDiabetes).toBe(false);
    expect(viewModel.visibleCoverageItems.map((item) => item.label)).toEqual([
      "Atendimento médico em dia",
      "Enfermagem em dia",
      "Odontologia em dia",
      "Visita domiciliar em dia",
      "PA recente",
    ]);
    expect(viewModel.narrative.title).toBe("Painel analítico focado em hipertensão");
  });
});
