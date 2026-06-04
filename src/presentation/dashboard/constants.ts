import { type CareGapFilter, type DashboardFiltersDTO } from "@/application/dtos/DashboardFiltersDTO";
import { type TimeRangePreset } from "@/domain/value-objects/TimeRangePreset";

export const PANEL_CLASS_NAME = [
  "rounded-[2rem] border border-border/70 bg-surface/95",
  "shadow-[0_24px_80px_rgba(20,58,96,0.10)] backdrop-blur",
].join(" ");

export const SECTION_CLASS_NAME = [
  "rounded-[1.75rem] border border-border/70 bg-surface p-5",
  "shadow-[0_18px_60px_rgba(20,58,96,0.08)]",
].join(" ");

export const DEFAULT_FILTERS: DashboardFiltersDTO = {
  conditions: [],
  sexes: [],
  raceColors: [],
  neighborhoods: [],
  familyAllowances: [],
  ageGroups: [],
  careGaps: [],
  professions: [],
  timePreset: "LAST_6_MONTHS",
  startDate: null,
  endDate: null,
};

export const CONDITION_OPTIONS: Array<{
  value: "DIABETES" | "HYPERTENSION";
  label: string;
  helper: string;
}> = [
  { value: "DIABETES", label: "Diabetes", helper: "Apenas a população diabética" },
  { value: "HYPERTENSION", label: "Hipertensão", helper: "Apenas a população hipertensa" },
];

export const CARE_GAP_OPTIONS: Array<{ value: CareGapFilter; label: string }> = [
  { value: "medical", label: "Sem atendimento médico > 6 meses" },
  { value: "nursing", label: "Sem enfermagem > 6 meses" },
  { value: "dental", label: "Sem odontologia > 6 meses" },
  { value: "home-visit", label: "Sem visita domiciliar > 3 meses" },
  { value: "blood-pressure", label: "Sem PA recente" },
  { value: "hba1c", label: "Sem HbA1c recente" },
];

export const FAMILY_ALLOWANCE_OPTIONS = [
  { value: "YES", label: "Sim" },
  { value: "NO", label: "Não" },
  { value: "UNKNOWN", label: "Não informado" },
] as const;

export const TIME_PRESET_OPTIONS: Array<{ value: TimeRangePreset; label: string }> = [
  { value: "DAY", label: "Dia" },
  { value: "WEEK", label: "Semana" },
  { value: "MONTH", label: "Mês" },
  { value: "LAST_3_MONTHS", label: "Últimos 3 meses" },
  { value: "LAST_6_MONTHS", label: "Últimos 6 meses" },
  { value: "YEAR", label: "Ano" },
  { value: "CUSTOM", label: "Período definido" },
];
