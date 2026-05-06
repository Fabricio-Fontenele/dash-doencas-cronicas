import { type CareGapFilter, type DashboardFiltersDTO } from "@/application/dtos/DashboardFiltersDTO";

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
};

export const CARE_GAP_OPTIONS: Array<{ value: CareGapFilter; label: string }> = [
  { value: "medical", label: "Sem atendimento médico > 6 meses" },
  { value: "nursing", label: "Sem enfermagem > 6 meses" },
  { value: "home-visit", label: "Sem visita domiciliar > 3 meses" },
  { value: "blood-pressure", label: "Sem PA recente" },
  { value: "hba1c", label: "Sem HbA1c recente" },
];

export const FAMILY_ALLOWANCE_OPTIONS = [
  { value: "YES", label: "Sim" },
  { value: "NO", label: "Não" },
  { value: "UNKNOWN", label: "Não informado" },
] as const;
