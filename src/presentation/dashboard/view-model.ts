import { type DashboardCoverageItemDTO, type DashboardViewDTO } from "@/application/dtos/DashboardViewDTO";
import { type UploadHistoryDTO } from "@/application/dtos/UploadHistoryDTO";
import { type DashboardFiltersDTO } from "@/application/dtos/DashboardFiltersDTO";

import { CARE_GAP_OPTIONS } from "@/presentation/dashboard/constants";

export interface DashboardActiveFilterChip {
  key: keyof DashboardFiltersDTO;
  value: string;
  label: string;
}

export interface DashboardSummaryCardViewModel {
  eyebrow: string;
  value: number;
  label: string;
  accent: string;
}

export interface DashboardNarrativeViewModel {
  title: string;
  description: string;
}

export interface DashboardSexChartItem {
  color: string;
  label: string;
  value: number;
}

export interface DashboardPageViewModel {
  hasDiabetes: boolean;
  hasHypertension: boolean;
  hasMixedConditions: boolean;
  conditionContextLabel: string;
  snapshotTitle: string;
  snapshotDescription: string;
  summaryCards: DashboardSummaryCardViewModel[];
  activeFilterChips: DashboardActiveFilterChip[];
  visibleCoverageItems: DashboardCoverageItemDTO[];
  sexChartItems: DashboardSexChartItem[];
  narrative: DashboardNarrativeViewModel;
}

export function buildDashboardPageViewModel(
  view: DashboardViewDTO,
  latestUpload: UploadHistoryDTO | null,
): DashboardPageViewModel {
  const conditionPresence = getConditionPresence(view);

  return {
    ...conditionPresence,
    conditionContextLabel: getConditionContextLabel(conditionPresence),
    snapshotTitle: latestUpload ? latestUpload.fileName : "Sem upload processado",
    snapshotDescription: latestUpload
      ? `Condição de origem: ${formatConditionLabel(latestUpload.condition)} • ${latestUpload.totalRecords} registros • ${formatUploadDate(latestUpload.createdAt)}`
      : "Carregue um arquivo para gerar a leitura quantitativa do território.",
    summaryCards: getSummaryCards(view, conditionPresence),
    activeFilterChips: getActiveFilterChips(view.appliedFilters),
    visibleCoverageItems: getVisibleCoverageItems(view, conditionPresence.hasDiabetes),
    sexChartItems: view.sexDistribution.map((item) => {
      const normalizedLabel = normalizeSexLabel(item.label);

      return {
        label: normalizedLabel,
        value: item.value,
        color: getSexColor(normalizedLabel),
      };
    }),
    narrative: getNarrativeViewModel(conditionPresence),
  };
}

function getConditionPresence(view: DashboardViewDTO) {
  const diabetesCount =
    view.conditionDistribution.find((item) => item.label === "Diabetes")?.value ?? 0;
  const hypertensionCount =
    view.conditionDistribution.find((item) => item.label === "Hipertensão")?.value ?? 0;

  return {
    hasDiabetes: diabetesCount > 0,
    hasHypertension: hypertensionCount > 0,
    hasMixedConditions: diabetesCount > 0 && hypertensionCount > 0,
  };
}

function getConditionContextLabel(conditionPresence: {
  hasDiabetes: boolean;
  hasHypertension: boolean;
  hasMixedConditions: boolean;
}): string {
  if (conditionPresence.hasMixedConditions) {
    return "diabetes e hipertensão";
  }

  if (conditionPresence.hasDiabetes) {
    return "diabetes";
  }

  if (conditionPresence.hasHypertension) {
    return "hipertensão";
  }

  return "condições crônicas";
}

function getSummaryCards(
  view: DashboardViewDTO,
  conditionPresence: {
    hasDiabetes: boolean;
    hasHypertension: boolean;
    hasMixedConditions: boolean;
  },
): DashboardSummaryCardViewModel[] {
  const summary = view.summary;

  if (conditionPresence.hasMixedConditions) {
    return [
      {
        eyebrow: "Universo",
        value: summary.totalRecords,
        label: "Pessoas no recorte atual",
        accent: "bg-accent-strong",
      },
      {
        eyebrow: "Atenção",
        value: summary.withoutMedicalCare,
        label: "Sem atendimento médico recente",
        accent: "bg-highlight",
      },
      {
        eyebrow: "Cobertura",
        value: summary.withoutHomeVisit,
        label: "Sem visita domiciliar recente",
        accent: "bg-accent",
      },
      {
        eyebrow: "Monitoramento",
        value: summary.withoutRecentBloodPressureCheck + summary.withoutRecentHbA1c,
        label: "Pendências de exames e aferições",
        accent: "bg-[var(--chart-4)]",
      },
    ];
  }

  if (conditionPresence.hasDiabetes) {
    return [
      {
        eyebrow: "Diabetes",
        value: summary.totalRecords,
        label: "Pessoas acompanhadas neste recorte",
        accent: "bg-accent-strong",
      },
      {
        eyebrow: "Consulta",
        value: summary.withoutMedicalCare,
        label: "Sem atendimento médico recente",
        accent: "bg-highlight",
      },
      {
        eyebrow: "Território",
        value: summary.withoutHomeVisit,
        label: "Sem visita domiciliar recente",
        accent: "bg-accent",
      },
      {
        eyebrow: "HbA1c",
        value: summary.withoutRecentHbA1c,
        label: "Sem hemoglobina glicada recente",
        accent: "bg-[var(--chart-4)]",
      },
    ];
  }

  if (conditionPresence.hasHypertension) {
    return [
      {
        eyebrow: "Hipertensão",
        value: summary.totalRecords,
        label: "Pessoas acompanhadas neste recorte",
        accent: "bg-accent-strong",
      },
      {
        eyebrow: "Consulta",
        value: summary.withoutMedicalCare,
        label: "Sem atendimento médico recente",
        accent: "bg-highlight",
      },
      {
        eyebrow: "Território",
        value: summary.withoutHomeVisit,
        label: "Sem visita domiciliar recente",
        accent: "bg-accent",
      },
      {
        eyebrow: "Pressão arterial",
        value: summary.withoutRecentBloodPressureCheck,
        label: "Sem aferição recente de PA",
        accent: "bg-[var(--chart-4)]",
      },
    ];
  }

  return [
    {
      eyebrow: "Universo",
      value: summary.totalRecords,
      label: "Pessoas no recorte atual",
      accent: "bg-accent-strong",
    },
    {
      eyebrow: "Atenção",
      value: summary.withoutMedicalCare,
      label: "Sem atendimento médico recente",
      accent: "bg-highlight",
    },
    {
      eyebrow: "Cobertura",
      value: summary.withoutHomeVisit,
      label: "Sem visita domiciliar recente",
      accent: "bg-accent",
    },
    {
      eyebrow: "Monitoramento",
      value: summary.withoutRecentBloodPressureCheck,
      label: "Pendências de exames e aferições",
      accent: "bg-[var(--chart-4)]",
    },
  ];
}

function getActiveFilterChips(filters: DashboardFiltersDTO): DashboardActiveFilterChip[] {
  return [
    ...filters.sexes.map((value) => ({
      key: "sexes" as const,
      value,
      label: value,
    })),
    ...filters.raceColors.map((value) => ({
      key: "raceColors" as const,
      value,
      label: value,
    })),
    ...filters.ageGroups.map((value) => ({
      key: "ageGroups" as const,
      value,
      label: value,
    })),
    ...filters.neighborhoods.map((value) => ({
      key: "neighborhoods" as const,
      value,
      label: value,
    })),
    ...filters.familyAllowances.map((value) => ({
      key: "familyAllowances" as const,
      value,
      label:
        value === "YES"
          ? "Bolsa Família: Sim"
          : value === "NO"
            ? "Bolsa Família: Não"
            : "Bolsa Família: Não informado",
    })),
    ...filters.careGaps.map((value) => ({
      key: "careGaps" as const,
      value,
      label: CARE_GAP_OPTIONS.find((option) => option.value === value)?.label ?? value,
    })),
  ];
}

function getVisibleCoverageItems(
  view: DashboardViewDTO,
  hasDiabetes: boolean,
): DashboardCoverageItemDTO[] {
  return view.careCoverage.filter((item) => hasDiabetes || item.label !== "HbA1c recente");
}

function getNarrativeViewModel(conditionPresence: {
  hasDiabetes: boolean;
  hasHypertension: boolean;
  hasMixedConditions: boolean;
}): DashboardNarrativeViewModel {
  if (conditionPresence.hasMixedConditions) {
    return {
      title: "Panorama integrado das duas linhas de cuidado",
      description:
        "O recorte atual combina pessoas com diabetes e hipertensão. Por isso, a dashboard destaca comparações entre condições e mantém todos os indicadores compartilhados e específicos.",
    };
  }

  if (conditionPresence.hasDiabetes) {
    return {
      title: "Panorama específico da linha de cuidado em diabetes",
      description:
        "Como o recorte atual traz apenas diabetes, a dashboard prioriza distribuições demográficas, bairros com maior volume e indicadores clínicos relevantes para essa linha, incluindo HbA1c.",
    };
  }

  if (conditionPresence.hasHypertension) {
    return {
      title: "Panorama específico da linha de cuidado em hipertensão",
      description:
        "Como o recorte atual traz apenas hipertensão, a dashboard remove comparações desnecessárias entre condições e concentra a leitura em pressão arterial, acompanhamento e distribuições do território.",
    };
  }

  return {
    title: "Panorama do recorte importado",
    description:
      "Quando houver dados no recorte, a narrativa da dashboard se ajusta automaticamente ao perfil importado.",
  };
}

export function getRaceColor(label: string): string {
  const normalized = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  if (normalized.includes("branca")) return "#d6e7f4";
  if (normalized.includes("parda")) return "#459cd7";
  if (normalized.includes("preta")) return "#143a60";
  if (normalized.includes("amarela")) return "#e8531e";
  if (normalized.includes("indigena")) return "#7a94ad";
  if (normalized.includes("nao inform")) return "#a6b9ca";

  return "#74818d";
}

function getSexColor(label: string): string {
  const normalized = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  if (normalized.includes("femin")) return "#e8531e";
  if (normalized.includes("mascul")) return "#143a60";
  if (normalized.includes("nao inform")) return "#a6b9ca";

  return "#459cd7";
}

function normalizeSexLabel(label: string): string {
  const normalized = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  if (normalized === "m" || normalized.includes("mascul")) return "Masculino";
  if (normalized === "f" || normalized.includes("femin")) return "Feminino";
  if (normalized.includes("nao inform")) return "Não informado";

  return label;
}

function formatUploadDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatConditionLabel(condition: "DIABETES" | "HYPERTENSION"): string {
  return condition === "DIABETES" ? "Diabetes" : "Hipertensão";
}
