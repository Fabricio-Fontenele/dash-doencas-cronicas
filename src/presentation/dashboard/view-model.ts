import { type DashboardCoverageItemDTO, type DashboardViewDTO } from "@/application/dtos/DashboardViewDTO";
import { type UploadHistoryDTO } from "@/application/dtos/UploadHistoryDTO";
import { type DashboardFiltersDTO } from "@/application/dtos/DashboardFiltersDTO";

import { CARE_GAP_OPTIONS, TIME_PRESET_OPTIONS } from "@/presentation/dashboard/constants";

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

export interface DashboardAnalyticSupportViewModel {
  supportsMedicalTimeline: boolean;
  supportsNursingTimeline: boolean;
  supportsDentalTimeline: boolean;
  supportsHomeVisitTimeline: boolean;
  supportsBmiClassification: boolean;
  supportsBloodPressureClassification: boolean;
  supportsHbA1cClassification: boolean;
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
  support: DashboardAnalyticSupportViewModel;
}

const EMPTY_SUPPORT: DashboardAnalyticSupportViewModel = {
  supportsMedicalTimeline: false,
  supportsNursingTimeline: false,
  supportsDentalTimeline: false,
  supportsHomeVisitTimeline: false,
  supportsBmiClassification: false,
  supportsBloodPressureClassification: false,
  supportsHbA1cClassification: false,
};

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
      ? `Condição de origem: ${formatConditionLabel(latestUpload.condition)} • ${latestUpload.totalRecords} registros • ${formatUploadDate(latestUpload.createdAt)} • janela analítica: ${view.periodLabel}`
      : "Carregue um arquivo para gerar a leitura quantitativa do território.",
    summaryCards: getSummaryCards(view),
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
    narrative: getNarrativeViewModel(conditionPresence, view.periodLabel),
    support: latestUpload
      ? {
          supportsMedicalTimeline: latestUpload.supportsMedicalTimeline,
          supportsNursingTimeline: latestUpload.supportsNursingTimeline,
          supportsDentalTimeline: latestUpload.supportsDentalTimeline,
          supportsHomeVisitTimeline: latestUpload.supportsHomeVisitTimeline,
          supportsBmiClassification: latestUpload.supportsBmiClassification,
          supportsBloodPressureClassification: latestUpload.supportsBloodPressureClassification,
          supportsHbA1cClassification: latestUpload.supportsHbA1cClassification,
        }
      : EMPTY_SUPPORT,
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
  if (conditionPresence.hasMixedConditions) return "diabetes e hipertensão";
  if (conditionPresence.hasDiabetes) return "diabetes";
  if (conditionPresence.hasHypertension) return "hipertensão";

  return "condições crônicas";
}

function getSummaryCards(view: DashboardViewDTO): DashboardSummaryCardViewModel[] {
  const summary = view.summary;

  return [
    {
      eyebrow: "Universo",
      value: summary.totalRecords,
      label: "Pessoas no recorte atual",
      accent: "bg-accent-strong",
    },
    {
      eyebrow: "Médico",
      value: summary.withoutMedicalCare,
      label: "Sem atendimento médico recente",
      accent: "bg-highlight",
    },
    {
      eyebrow: "Enfermagem/Odonto",
      value: summary.withoutNursingCare + summary.withoutDentalCare,
      label: "Pendências combinadas de enfermagem e odontologia",
      accent: "bg-accent",
    },
    {
      eyebrow: "Monitoramento",
      value: summary.withoutRecentBloodPressureCheck + summary.withoutRecentHbA1c,
      label: "Pendências de PA e hemoglobina glicada",
      accent: "bg-[var(--chart-4)]",
    },
  ];
}

function getActiveFilterChips(filters: DashboardFiltersDTO): DashboardActiveFilterChip[] {
  return [
    ...filters.sexes.map((value) => ({ key: "sexes" as const, value, label: value })),
    ...filters.raceColors.map((value) => ({ key: "raceColors" as const, value, label: value })),
    ...filters.ibgeRaceColors.map((value) => ({
      key: "ibgeRaceColors" as const,
      value,
      label: `IBGE: ${value}`,
    })),
    ...filters.ageGroups.map((value) => ({ key: "ageGroups" as const, value, label: value })),
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
    ...filters.professions.map((value) => ({
      key: "professions" as const,
      value,
      label: getProfessionLabel(value),
    })),
    {
      key: "timePreset" as const,
      value: filters.timePreset,
      label:
        TIME_PRESET_OPTIONS.find((option) => option.value === filters.timePreset)?.label ??
        filters.timePreset,
    },
    ...(filters.startDate
      ? [{ key: "startDate" as const, value: filters.startDate, label: `Início: ${filters.startDate}` }]
      : []),
    ...(filters.endDate
      ? [{ key: "endDate" as const, value: filters.endDate, label: `Fim: ${filters.endDate}` }]
      : []),
  ];
}

function getVisibleCoverageItems(
  view: DashboardViewDTO,
  hasDiabetes: boolean,
): DashboardCoverageItemDTO[] {
  return view.careCoverage.filter((item) => hasDiabetes || item.label !== "HbA1c recente");
}

function getNarrativeViewModel(
  conditionPresence: {
    hasDiabetes: boolean;
    hasHypertension: boolean;
    hasMixedConditions: boolean;
  },
  periodLabel: string,
): DashboardNarrativeViewModel {
  if (conditionPresence.hasMixedConditions) {
    return {
      title: "Panorama integrado das linhas de cuidado",
      description: `A leitura atual combina produção assistencial, perfil populacional e estratificação clínica em ${periodLabel}, permitindo navegar entre demografia, cuidado e gravidade sem sair da dashboard principal.`,
    };
  }

  if (conditionPresence.hasDiabetes) {
    return {
      title: "Painel analítico focado em diabetes",
      description:
        "O recorte atual privilegia HbA1c, IMC, cobertura assistencial e composição demográfica da linha de diabetes.",
    };
  }

  if (conditionPresence.hasHypertension) {
    return {
      title: "Painel analítico focado em hipertensão",
      description:
        "O recorte atual privilegia pressão arterial, IMC, cobertura assistencial e composição demográfica da linha de hipertensão.",
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

function getProfessionLabel(value: string): string {
  if (value === "MEDICAL") return "Médico";
  if (value === "NURSING") return "Enfermagem";
  if (value === "DENTAL") return "Odontologia";
  if (value === "HOME_VISIT") return "Visita domiciliar";

  return value;
}

function formatUploadDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatConditionLabel(condition: "DIABETES" | "HYPERTENSION" | "MIXED"): string {
  if (condition === "DIABETES") return "Diabetes";
  if (condition === "HYPERTENSION") return "Hipertensão";

  return "Diabetes + Hipertensão";
}
