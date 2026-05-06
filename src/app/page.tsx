import Link from "next/link";

import {
  type CareGapFilter,
  type DashboardFiltersDTO,
} from "@/application/dtos/DashboardFiltersDTO";
import { type DashboardSummaryDTO } from "@/application/dtos/DashboardSummaryDTO";
import {
  type DashboardBarChartItemDTO,
  type DashboardCoverageItemDTO,
  type DashboardInsightDTO,
  type DashboardViewDTO,
} from "@/application/dtos/DashboardViewDTO";
import { type UploadHistoryDTO } from "@/application/dtos/UploadHistoryDTO";
import { GenerateDashboardViewUseCase } from "@/application/use-cases/dashboard/GenerateDashboardViewUseCase";
import { ListRecentUploadsUseCase } from "@/application/use-cases/upload/ListRecentUploadsUseCase";
import { InteractivePieChart } from "@/components/dashboard/interactive-pie-chart";
import { AGE_GROUPS } from "@/domain/value-objects/AgeGroup";
import { PrismaAggregateBucketRepository } from "@/infrastructure/database/repositories/PrismaAggregateBucketRepository";
import { PrismaUploadRepository } from "@/infrastructure/database/repositories/PrismaUploadRepository";

export const dynamic = "force-dynamic";

const PANEL_CLASS_NAME = [
  "rounded-[2rem] border border-border/70 bg-surface/95",
  "shadow-[0_24px_80px_rgba(20,58,96,0.10)] backdrop-blur",
].join(" ");

const SECTION_CLASS_NAME = [
  "rounded-[1.75rem] border border-border/70 bg-surface p-5",
  "shadow-[0_18px_60px_rgba(20,58,96,0.08)]",
].join(" ");

const DEFAULT_FILTERS: DashboardFiltersDTO = {
  conditions: [],
  sexes: [],
  raceColors: [],
  neighborhoods: [],
  familyAllowances: [],
  ageGroups: [],
  careGaps: [],
};

const EMPTY_SUMMARY: DashboardSummaryDTO = {
  totalRecords: 0,
  withoutMedicalCare: 0,
  withoutNursingCare: 0,
  withoutHomeVisit: 0,
  withoutRecentBloodPressureCheck: 0,
  withoutRecentHbA1c: 0,
  totalDiabetes: 0,
  totalHypertension: 0,
};

const CARE_GAP_OPTIONS: Array<{ value: CareGapFilter; label: string }> = [
  { value: "medical", label: "Sem atendimento médico > 6 meses" },
  { value: "nursing", label: "Sem enfermagem > 6 meses" },
  { value: "home-visit", label: "Sem visita domiciliar > 3 meses" },
  { value: "blood-pressure", label: "Sem PA recente" },
  { value: "hba1c", label: "Sem HbA1c recente" },
];

const FAMILY_ALLOWANCE_OPTIONS = [
  { value: "YES", label: "Sim" },
  { value: "NO", label: "Não" },
  { value: "UNKNOWN", label: "Não informado" },
] as const;

type SearchParamValue = string | string[] | undefined;

interface HomePageProps {
  searchParams?: Promise<Record<string, SearchParamValue>>;
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

function parseFilters(searchParams: Record<string, SearchParamValue>): DashboardFiltersDTO {
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

function createQueryString(filters: DashboardFiltersDTO): string {
  const params = new URLSearchParams();

  for (const condition of filters.conditions) params.append("condition", condition);
  for (const sex of filters.sexes) params.append("sex", sex);
  for (const raceColor of filters.raceColors) params.append("raceColor", raceColor);
  for (const neighborhood of filters.neighborhoods) params.append("neighborhood", neighborhood);
  for (const familyAllowance of filters.familyAllowances) {
    params.append("familyAllowance", familyAllowance);
  }
  for (const ageGroup of filters.ageGroups) params.append("ageGroup", ageGroup);
  for (const careGap of filters.careGaps) params.append("careGap", careGap);

  const query = params.toString();
  return query ? `/?${query}` : "/";
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

function getConditionContextLabel(view: DashboardViewDTO): string {
  const { hasDiabetes, hasHypertension, hasMixedConditions } = getConditionPresence(view);

  if (hasMixedConditions) {
    return "diabetes e hipertensão";
  }

  if (hasDiabetes) {
    return "diabetes";
  }

  if (hasHypertension) {
    return "hipertensão";
  }

  return "condições crônicas";
}

function removeFilterValue(
  filters: DashboardFiltersDTO,
  key: keyof DashboardFiltersDTO,
  value: string,
): DashboardFiltersDTO {
  return {
    ...filters,
    [key]: filters[key].filter((currentValue) => currentValue !== value),
  } as DashboardFiltersDTO;
}

function getActiveFilterChips(filters: DashboardFiltersDTO) {
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

function FilterGroup({
  title,
  name,
  options,
  selectedValues,
  compact = false,
}: {
  title: string;
  name: string;
  options: Array<{ value: string; label: string; helper?: string }>;
  selectedValues: string[];
  compact?: boolean;
}) {
  return (
      <details className="group rounded-[1.5rem] border border-border/70 bg-white/80 p-4">
      <summary className="cursor-pointer list-none text-sm font-semibold text-accent-strong">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span>{title}</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="size-4 text-muted transition group-open:rotate-180"
              fill="none"
            >
              <path
                d="m5 7.5 5 5 5-5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </div>
          <span className="rounded-full bg-surface-strong px-2 py-0.5 text-xs text-muted">
            {selectedValues.length}
          </span>
        </div>
      </summary>

      <div className={`mt-4 grid gap-2 ${compact ? "sm:grid-cols-2" : ""}`}>
        {options.map((option) => {
          const checked = selectedValues.includes(option.value);

          return (
            <label
              key={option.value}
              className={`flex cursor-pointer gap-3 rounded-[1.1rem] border px-3 py-3 text-sm transition ${
                checked
                  ? "border-accent-strong bg-[rgba(69,156,215,0.16)]"
                  : "border-border/70 bg-white hover:border-accent/40"
              }`}
            >
              <input
                type="checkbox"
                name={name}
                value={option.value}
                defaultChecked={checked}
                className="mt-0.5 size-4 accent-[var(--color-accent)]"
              />
              <span className="min-w-0">
                <span className="block font-medium text-accent-strong">{option.label}</span>
                {option.helper ? (
                  <span className="mt-0.5 block text-xs text-muted">{option.helper}</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </details>
  );
}

function StatCard({
  eyebrow,
  value,
  label,
  accent,
}: {
  eyebrow: string;
  value: number;
  label: string;
  accent: string;
}) {
  return (
    <article className={SECTION_CLASS_NAME}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">{eyebrow}</p>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-accent-strong">{value}</p>
          <p className="mt-3 max-w-[18rem] text-sm leading-6 text-muted">{label}</p>
        </div>
        <span className={`mt-1 block size-3 rounded-full ${accent}`} />
      </div>
    </article>
  );
}

function InsightCard({
  title,
  value,
  description,
  tone,
}: DashboardInsightDTO) {
  const toneClassName =
    tone === "highlight"
      ? "bg-highlight"
      : tone === "secondary"
        ? "bg-accent"
        : tone === "muted"
          ? "bg-[var(--chart-4)]"
          : "bg-accent-strong";

  return (
    <article className={SECTION_CLASS_NAME}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">{title}</p>
          <p className="text-3xl font-semibold tracking-tight text-accent-strong">{value}</p>
          <p className="max-w-[24rem] text-sm leading-6 text-muted">{description}</p>
        </div>
        <span className={`mt-1 block size-3 rounded-full ${toneClassName}`} />
      </div>
    </article>
  );
}

function HorizontalBars({
  title,
  subtitle,
  items,
  tone = "bg-accent",
}: {
  title: string;
  subtitle: string;
  items: DashboardBarChartItemDTO[];
  tone?: string;
}) {
  const sortedItems = [...items].sort(
    (left, right) => right.value - left.value || left.label.localeCompare(right.label),
  );
  const maxValue = Math.max(...sortedItems.map((item) => item.value), 1);

  return (
    <section className={SECTION_CLASS_NAME}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">{title}</p>
      <h2 className="mt-2 text-2xl font-semibold text-accent-strong">{subtitle}</h2>

      <div className="mt-6 space-y-4">
        {sortedItems.length === 0 ? (
          <p className="text-sm text-muted">Sem dados para este recorte.</p>
        ) : (
          sortedItems.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <p className="truncate text-sm font-medium text-accent-strong">{item.label}</p>
                </div>
                <p className="text-sm text-muted">{item.value}</p>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-surface-strong">
                <div
                  className={`h-full rounded-full ${tone}`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function ComparisonColumns({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: DashboardBarChartItemDTO[];
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <section className={SECTION_CLASS_NAME}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">{title}</p>
      <h2 className="mt-2 text-2xl font-semibold text-accent-strong">{subtitle}</h2>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Sem dados para este recorte.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {items.map((item, index) => (
            <article
              key={item.label}
              className="flex min-h-[14rem] flex-col justify-end rounded-[1.5rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(214,231,244,0.92))] p-4"
            >
              <div className="flex min-h-[7.5rem] items-end">
                <div
                  className={`w-full rounded-t-[1.25rem] ${
                    index % 3 === 0
                      ? "bg-[var(--chart-1)]"
                      : index % 3 === 1
                        ? "bg-[var(--chart-2)]"
                        : "bg-[var(--chart-3)]"
                  }`}
                  style={{ height: `${Math.max((item.value / maxValue) * 100, 10)}%` }}
                />
              </div>
              <p className="mt-4 text-sm font-medium text-accent-strong">{item.label}</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-accent-strong">{item.value}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function PieChart({
  title,
  subtitle,
  items,
  getColor,
  donut = false,
}: {
  title: string;
  subtitle: string;
  items: DashboardBarChartItemDTO[];
  getColor: (label: string) => string;
  donut?: boolean;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (items.length === 0 || total === 0) {
    return (
      <section className={SECTION_CLASS_NAME}>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">{title}</p>
        <h2 className="mt-2 text-2xl font-semibold text-accent-strong">{subtitle}</h2>
        <p className="mt-6 text-sm text-muted">Sem dados para este recorte.</p>
      </section>
    );
  }

  const gradientStops = items
    .reduce<Array<{ start: number; end: number; color: string }>>(
      (segments, item) => {
        const previousEnd = segments[segments.length - 1]?.end ?? 0;
        const segmentSize = (item.value / total) * 100;

        return [
          ...segments,
          {
            start: previousEnd,
            end: previousEnd + segmentSize,
            color: getColor(item.label),
          },
        ];
      },
      [],
    )
    .map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`)
    .join(", ");

  return (
    <section className={SECTION_CLASS_NAME}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">{title}</p>
      <h2 className="mt-2 text-2xl font-semibold text-accent-strong">{subtitle}</h2>

      <div className="mt-6 grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-center">
        <div className="flex flex-col items-center">
          <div
            className="relative size-48 rounded-full"
            style={{
              background: `conic-gradient(${gradientStops})`,
            }}
          >
            {donut ? (
              <div className="absolute inset-5 rounded-full bg-surface shadow-[inset_0_0_0_1px_rgba(20,58,96,0.12)]" />
            ) : null}
          </div>
          <div className="mt-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Total
            </span>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-accent-strong">
              {total}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const percentage = Math.round((item.value / total) * 100);
            const color = getColor(item.label);

            return (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4 rounded-[1.15rem] border border-border/70 bg-white/80 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="block size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate text-sm font-medium text-accent-strong">{item.label}</span>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-accent-strong">{percentage}%</p>
                  <p className="text-xs text-muted">{item.value} pessoas</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function getRaceColor(label: string): string {
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

function CoverageDeck({ items }: { items: DashboardCoverageItemDTO[] }) {
  return (
    <section className={SECTION_CLASS_NAME}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Cobertura</p>
      <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
        Equilíbrio entre acompanhamento em dia e em atraso
      </h2>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <article
            key={item.label}
            className="rounded-[1.5rem] border border-border/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.78),rgba(214,231,244,0.86))] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-accent-strong">{item.label}</p>
              <p className="text-sm font-semibold text-accent-strong">{item.coverageRate}%</p>
            </div>
            <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-surface-strong">
              <div
                className="bg-accent-strong"
                style={{ width: `${item.coverageRate}%` }}
              />
              <div
                className="bg-highlight"
                style={{ width: `${100 - item.coverageRate}%` }}
              />
            </div>
            <div className="mt-4 flex justify-between text-xs text-muted">
              <span>Em dia: {item.covered}</span>
              <span>Em atraso: {item.uncovered}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function getVisibleCoverageItems(view: DashboardViewDTO): DashboardCoverageItemDTO[] {
  const { hasDiabetes } = getConditionPresence(view);

  return view.careCoverage.filter((item) => hasDiabetes || item.label !== "HbA1c recente");
}

function getSummaryCards(view: DashboardViewDTO) {
  const summary = view.summary;
  const { hasMixedConditions, hasDiabetes, hasHypertension } = getConditionPresence(view);

  if (hasMixedConditions) {
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

  if (hasDiabetes) {
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
        eyebrow: "Territorio",
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

  if (hasHypertension) {
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
        eyebrow: "Territorio",
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

export default async function Home({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const filters = parseFilters(params);
  const dashboardData = await loadDashboardData(filters);
  const { hasMixedConditions, hasDiabetes, hasHypertension } = getConditionPresence(
    dashboardData.view,
  );
  const summaryCards = getSummaryCards(dashboardData.view);
  const activeChips = getActiveFilterChips(dashboardData.view.appliedFilters);
  const conditionContextLabel = getConditionContextLabel(dashboardData.view);
  const visibleCoverageItems = getVisibleCoverageItems(dashboardData.view);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f4f3f3_0%,#e2e0e0_42%,#d6e7f4_100%)]">
      <section className="mx-auto w-full max-w-[92rem] px-5 py-8 lg:px-8">
        <header className={`${PANEL_CLASS_NAME} relative overflow-hidden p-7 lg:p-9`}>
          <div className="absolute inset-y-0 right-0 hidden w-[32rem] bg-[radial-gradient(circle_at_center,rgba(69,156,215,0.20),transparent_68%)] lg:block" />
          <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <span className="inline-flex rounded-full border border-border bg-surface-strong px-4 py-1 text-sm font-medium text-accent-strong">
                Sala de situação crônica
              </span>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-accent-strong sm:text-5xl">
                Dashboard quantitativo com filtros facetados e leitura territorial do recorte importado.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
                Os CSVs são convertidos em recortes anonimizados. Aqui o foco é volume,
                distribuição e lacunas assistenciais em {conditionContextLabel}, sem qualquer dado nominal.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/importar"
                className="inline-flex h-12 items-center justify-center rounded-full bg-accent-strong px-6 text-sm font-semibold text-white transition hover:bg-accent"
              >
                Importar novo snapshot
              </Link>
              <Link
                href={createQueryString(DEFAULT_FILTERS)}
                className="inline-flex h-12 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-accent-strong transition hover:bg-surface-strong"
              >
                Limpar todos os filtros
              </Link>
            </div>
          </div>
        </header>

        {!dashboardData.hasDatabaseConnection ? (
          <section className="mt-6 rounded-[1.75rem] border border-highlight/30 bg-highlight-soft p-5 text-sm text-[var(--status-error-text)]">
            O banco não está acessível nesta execução. O layout continua disponível, mas os dados só aparecem quando o PostgreSQL estiver pronto.
          </section>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className={`${PANEL_CLASS_NAME} sticky top-6 p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Filtros</p>
                  <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
                    Monte o recorte
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Cada grupo aceita múltiplas escolhas. Dentro do grupo, a lógica é de união.
                  </p>
                </div>
                <div className="rounded-full bg-surface-strong px-3 py-1 text-xs font-semibold text-muted">
                  {dashboardData.view.filteredRecordCount} registros
                </div>
              </div>

              <form className="mt-6 space-y-4">
                <FilterGroup
                  title="Sexo"
                  name="sex"
                  compact
                  selectedValues={dashboardData.view.appliedFilters.sexes}
                  options={dashboardData.view.filterOptions.sexes.map((value) => ({
                    value,
                    label: value,
                  }))}
                />

                <FilterGroup
                  title="Raça/cor"
                  name="raceColor"
                  selectedValues={dashboardData.view.appliedFilters.raceColors}
                  options={dashboardData.view.filterOptions.raceColors.map((value) => ({
                    value,
                    label: value,
                  }))}
                />

                <FilterGroup
                  title="Faixa etária"
                  name="ageGroup"
                  compact
                  selectedValues={dashboardData.view.appliedFilters.ageGroups}
                  options={AGE_GROUPS.map((value) => ({
                    value,
                    label: value,
                  }))}
                />

                <FilterGroup
                  title="Bolsa Familia"
                  name="familyAllowance"
                  compact
                  selectedValues={dashboardData.view.appliedFilters.familyAllowances}
                  options={FAMILY_ALLOWANCE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                />

                <FilterGroup
                  title="Lacunas do cuidado"
                  name="careGap"
                  selectedValues={dashboardData.view.appliedFilters.careGaps}
                  options={CARE_GAP_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                />

                <FilterGroup
                  title="Bairro"
                  name="neighborhood"
                  selectedValues={dashboardData.view.appliedFilters.neighborhoods}
                  options={dashboardData.view.filterOptions.neighborhoods.map((value) => ({
                    value,
                    label: value,
                  }))}
                />

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-semibold text-white transition hover:bg-accent"
                  >
                    Aplicar recorte
                  </button>
                  <Link
                    href={createQueryString(DEFAULT_FILTERS)}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-accent-strong transition hover:bg-surface-strong"
                  >
                    Resetar
                  </Link>
                </div>
              </form>
            </section>
          </aside>

          <div className="space-y-6">
            <section className={`${PANEL_CLASS_NAME} p-5`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Snapshot atual</p>
                  <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
                    {dashboardData.latestUpload ? dashboardData.latestUpload.fileName : "Sem upload processado"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {dashboardData.latestUpload
                      ? `Condição de origem: ${formatConditionLabel(dashboardData.latestUpload.condition)} • ${dashboardData.latestUpload.totalRecords} registros • ${formatUploadDate(dashboardData.latestUpload.createdAt)}`
                      : "Carregue um arquivo para gerar a leitura quantitativa do território."}
                  </p>
                </div>

                <div className="flex max-w-xl flex-wrap gap-2">
                  {activeChips.length === 0 ? (
                    <span className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted">
                      Nenhum filtro aplicado
                    </span>
                  ) : (
                    activeChips.map((chip) => (
                      <Link
                        key={`${chip.key}-${chip.value}`}
                        href={createQueryString(
                          removeFilterValue(dashboardData.view.appliedFilters, chip.key, chip.value),
                        )}
                        className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-accent-strong transition hover:border-accent"
                      >
                        {chip.label} ×
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              {summaryCards.map((card) => (
                <StatCard key={card.label} {...card} />
              ))}
            </section>

            {dashboardData.view.insights.length > 0 ? (
              <section className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                    Insights do recorte
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
                    Leitura executiva para priorização
                  </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {dashboardData.view.insights.map((insight) => (
                    <InsightCard key={insight.title} {...insight} />
                  ))}
                </div>
              </section>
            ) : null}

            <section
              className={`grid gap-4 ${hasMixedConditions ? "2xl:grid-cols-[1.1fr_0.9fr]" : "2xl:grid-cols-1"}`}
            >
              <HorizontalBars
                title="Territorio"
                subtitle="Top bairros com mais pessoas acompanhadas"
                items={dashboardData.view.topNeighborhoods}
                tone="bg-[linear-gradient(90deg,#459cd7_0%,#143a60_100%)]"
              />
              {hasMixedConditions ? (
                <ComparisonColumns
                  title="Condição"
                  subtitle="Distribuição entre diabetes e hipertensão"
                  items={dashboardData.view.conditionDistribution}
                />
              ) : null}
            </section>

            <section className="grid gap-4 2xl:grid-cols-[0.9fr_1.1fr]">
              <InteractivePieChart
                title="Sexo"
                subtitle="Composição do recorte por sexo"
                items={dashboardData.view.sexDistribution.map((item) => ({
                  label: normalizeSexLabel(item.label),
                  value: item.value,
                  color: getSexColor(normalizeSexLabel(item.label)),
                }))}
                totalLabel="Total"
              />
              <HorizontalBars
                title="Faixa etária"
                subtitle="Distribuição por faixa etária"
                items={dashboardData.view.ageGroupDistribution}
                tone="bg-highlight"
              />
            </section>

            <section className="grid gap-4 2xl:grid-cols-[1fr_1fr]">
              <PieChart
                title="Raça/cor"
                subtitle="Composição do recorte por raça/cor"
                items={dashboardData.view.raceColorDistribution}
                getColor={getRaceColor}
                donut
              />
              <CoverageDeck items={visibleCoverageItems} />
            </section>

            <section className={SECTION_CLASS_NAME}>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                Leitura do recorte
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
                {hasMixedConditions
                  ? "Panorama integrado das duas linhas de cuidado"
                  : hasDiabetes
                    ? "Panorama específico da linha de cuidado em diabetes"
                    : hasHypertension
                      ? "Panorama específico da linha de cuidado em hipertensão"
                      : "Panorama do recorte importado"}
              </h2>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">
                {hasMixedConditions
                  ? "O recorte atual combina pessoas com diabetes e hipertensão. Por isso, a dashboard destaca comparações entre condições e mantém todos os indicadores compartilhados e específicos."
                  : hasDiabetes
                    ? "Como o recorte atual traz apenas diabetes, a dashboard prioriza distribuições demográficas, bairros com maior volume e indicadores clínicos relevantes para essa linha, incluindo HbA1c."
                    : hasHypertension
                      ? "Como o recorte atual traz apenas hipertensão, a dashboard remove comparações desnecessárias entre condições e concentra a leitura em pressão arterial, acompanhamento e distribuições do território."
                      : "Quando houver dados no recorte, a narrativa da dashboard se ajusta automaticamente ao perfil importado."}
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

async function loadDashboardData(filters: DashboardFiltersDTO) {
  try {
    const uploadRepository = new PrismaUploadRepository();
    const aggregateBucketRepository = new PrismaAggregateBucketRepository();

    const [view, uploads] = await Promise.all([
      new GenerateDashboardViewUseCase(aggregateBucketRepository).execute(filters),
      new ListRecentUploadsUseCase(uploadRepository).execute(1),
    ]);

    return {
      view,
      latestUpload: uploads[0] ?? null,
      hasDatabaseConnection: true,
    };
  } catch {
    return {
      view: {
        summary: EMPTY_SUMMARY,
        filteredRecordCount: 0,
        conditionDistribution: [
          { label: "Diabetes", value: 0 },
          { label: "Hipertensão", value: 0 },
        ],
        topNeighborhoods: [],
        ageGroupDistribution: [],
        sexDistribution: [],
        raceColorDistribution: [],
        careCoverage: [
          { label: "Atendimento médico em dia", covered: 0, uncovered: 0, coverageRate: 0 },
          { label: "Enfermagem em dia", covered: 0, uncovered: 0, coverageRate: 0 },
          { label: "Visita domiciliar em dia", covered: 0, uncovered: 0, coverageRate: 0 },
          { label: "PA recente", covered: 0, uncovered: 0, coverageRate: 0 },
          { label: "HbA1c recente", covered: 0, uncovered: 0, coverageRate: 0 },
        ],
        insights: [],
        filterOptions: {
          neighborhoods: [],
          sexes: [],
          raceColors: [],
        },
        appliedFilters: filters,
      } satisfies DashboardViewDTO,
      latestUpload: null as UploadHistoryDTO | null,
      hasDatabaseConnection: false,
    };
  }
}
