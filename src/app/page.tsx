import Link from "next/link";

import { type DashboardFiltersDTO, type CareGapFilter } from "@/application/dtos/DashboardFiltersDTO";
import { type DashboardSummaryDTO } from "@/application/dtos/DashboardSummaryDTO";
import { type DashboardViewDTO, type DashboardBarChartItemDTO } from "@/application/dtos/DashboardViewDTO";
import { type UploadHistoryDTO } from "@/application/dtos/UploadHistoryDTO";
import { GenerateDashboardViewUseCase } from "@/application/use-cases/dashboard/GenerateDashboardViewUseCase";
import { ListRecentUploadsUseCase } from "@/application/use-cases/upload/ListRecentUploadsUseCase";
import { AGE_GROUPS } from "@/domain/value-objects/AgeGroup";
import { PrismaAggregateBucketRepository } from "@/infrastructure/database/repositories/PrismaAggregateBucketRepository";
import { PrismaUploadRepository } from "@/infrastructure/database/repositories/PrismaUploadRepository";

export const dynamic = "force-dynamic";

const CARD_CLASS_NAME = [
  "rounded-[1.75rem] border border-border bg-surface p-5",
  "shadow-[0_20px_50px_rgba(49,92,66,0.08)]",
].join(" ");

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

const DEFAULT_FILTERS: DashboardFiltersDTO = {
  condition: "ALL",
  sex: null,
  raceColor: null,
  neighborhood: null,
  familyAllowance: "ALL",
  ageGroup: "ALL",
  careGap: null,
};

type SearchParamValue = string | string[] | undefined;

interface HomePageProps {
  searchParams?: Promise<Record<string, SearchParamValue>>;
}

function formatUploadDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function parseSingleValue(value: SearchParamValue): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function parseFilters(searchParams: Record<string, SearchParamValue>): DashboardFiltersDTO {
  const condition = parseSingleValue(searchParams.condition);
  const familyAllowance = parseSingleValue(searchParams.familyAllowance);
  const ageGroup = parseSingleValue(searchParams.ageGroup);
  const careGap = parseSingleValue(searchParams.careGap);

  return {
    condition:
      condition === "DIABETES" || condition === "HYPERTENSION"
        ? condition
        : DEFAULT_FILTERS.condition,
    sex: parseSingleValue(searchParams.sex),
    raceColor: parseSingleValue(searchParams.raceColor),
    neighborhood: parseSingleValue(searchParams.neighborhood),
    familyAllowance:
      familyAllowance === "YES" || familyAllowance === "NO"
        ? familyAllowance
        : DEFAULT_FILTERS.familyAllowance,
    ageGroup:
      ageGroup && AGE_GROUPS.includes(ageGroup as (typeof AGE_GROUPS)[number])
        ? (ageGroup as (typeof AGE_GROUPS)[number])
        : DEFAULT_FILTERS.ageGroup,
    careGap:
      careGap === "medical" ||
      careGap === "nursing" ||
      careGap === "home-visit" ||
      careGap === "blood-pressure" ||
      careGap === "hba1c"
        ? (careGap as CareGapFilter)
        : DEFAULT_FILTERS.careGap,
  };
}

function createQueryString(
  filters: DashboardFiltersDTO,
  overrides: Partial<DashboardFiltersDTO>,
): string {
  const next = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (next.condition !== "ALL") params.set("condition", next.condition);
  if (next.sex) params.set("sex", next.sex);
  if (next.raceColor) params.set("raceColor", next.raceColor);
  if (next.neighborhood) params.set("neighborhood", next.neighborhood);
  if (next.familyAllowance !== "ALL") params.set("familyAllowance", next.familyAllowance);
  if (next.ageGroup !== "ALL") params.set("ageGroup", next.ageGroup);
  if (next.careGap) params.set("careGap", next.careGap);

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function getSummaryCards(summary: DashboardSummaryDTO) {
  return [
    { label: "Total no recorte", value: summary.totalRecords, careGap: null },
    { label: "Sem atendimento medico > 6 meses", value: summary.withoutMedicalCare, careGap: "medical" as CareGapFilter },
    { label: "Sem enfermagem > 6 meses", value: summary.withoutNursingCare, careGap: "nursing" as CareGapFilter },
    { label: "Sem visita domiciliar > 3 meses", value: summary.withoutHomeVisit, careGap: "home-visit" as CareGapFilter },
    { label: "Sem PA recente", value: summary.withoutRecentBloodPressureCheck, careGap: "blood-pressure" as CareGapFilter },
    { label: "Sem HbA1c recente", value: summary.withoutRecentHbA1c, careGap: "hba1c" as CareGapFilter },
  ];
}

function formatConditionLabel(condition: "DIABETES" | "HYPERTENSION"): string {
  return condition === "DIABETES" ? "Diabetes" : "Hipertensao";
}

function ChartCard({
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
    <section className={CARD_CLASS_NAME}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">{title}</p>
          <h2 className="mt-2 text-2xl font-semibold text-accent-strong">{subtitle}</h2>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted">Sem dados para este recorte.</p>
        ) : (
          items.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-accent-strong">{item.label}</span>
                <span className="text-muted">{item.value}</span>
              </div>
              <div className="h-2 rounded-full bg-surface-strong">
                <div
                  className="h-full rounded-full bg-accent"
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

export default async function Home({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const filters = parseFilters(params);
  const dashboardData = await loadDashboardData(filters);
  const summaryCards = getSummaryCards(dashboardData.view.summary);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#eef5e5_0%,#f4f1e8_34%,#ebe1ce_100%)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-10">
        <header className="relative overflow-hidden rounded-[2rem] border border-border bg-surface p-7 shadow-[0_28px_80px_rgba(49,92,66,0.10)]">
          <div className="absolute inset-y-0 right-0 hidden w-[34%] bg-[radial-gradient(circle_at_center,rgba(49,92,66,0.18),transparent_70%)] lg:block" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-border bg-surface-strong px-4 py-1 text-sm font-medium text-accent-strong">
                Dashboard quantitativa
              </span>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-accent-strong sm:text-5xl">
                Panorama agregado do ultimo snapshot importado.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
                O sistema processa os CSVs e gera metricas anonimizadas para acompanhamento de diabetes e hipertensao, sem armazenar nomes ou identificadores individuais.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/importar"
                className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-white transition hover:bg-accent-strong"
              >
                Novo upload
              </Link>
              <Link
                href={createQueryString(DEFAULT_FILTERS, {})}
                className="inline-flex h-12 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-accent-strong transition hover:bg-surface-strong"
              >
                Limpar filtros
              </Link>
            </div>
          </div>
        </header>

        {!dashboardData.hasDatabaseConnection ? (
          <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            O banco nao esta acessivel nesta execucao. O painel continua pronto, mas os dados so aparecem quando o PostgreSQL estiver disponivel.
          </section>
        ) : null}

        {dashboardData.latestUpload ? (
          <section className={CARD_CLASS_NAME}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">Ultimo upload</p>
                <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
                  {dashboardData.latestUpload.fileName}
                </h2>
              </div>

              <div className="grid gap-3 text-sm text-muted sm:grid-cols-3">
                <div>
                  <p className="font-medium text-accent-strong">Condicao</p>
                  <p>{formatConditionLabel(dashboardData.latestUpload.condition)}</p>
                </div>
                <div>
                  <p className="font-medium text-accent-strong">Registros</p>
                  <p>{dashboardData.latestUpload.totalRecords}</p>
                </div>
                <div>
                  <p className="font-medium text-accent-strong">Momento</p>
                  <p>{formatUploadDate(dashboardData.latestUpload.createdAt)}</p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => {
            const href = createQueryString(dashboardData.view.appliedFilters, {
              careGap: dashboardData.view.appliedFilters.careGap === card.careGap ? null : card.careGap,
            });
            const isActive =
              card.careGap !== null && dashboardData.view.appliedFilters.careGap === card.careGap;

            return (
              <Link
                key={card.label}
                href={href}
                className={`${CARD_CLASS_NAME} transition hover:-translate-y-0.5 ${isActive ? "ring-2 ring-accent/40" : ""}`}
              >
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">{card.label}</p>
                <p className="mt-4 text-4xl font-semibold text-accent-strong">{card.value}</p>
                <p className="mt-3 text-xs text-muted">
                  {card.careGap ? "Clique para filtrar este indicador." : "Visao agregada do recorte atual."}
                </p>
              </Link>
            );
          })}
        </section>

        <section className={CARD_CLASS_NAME}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">Filtros ativos</p>
              <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
                Recorte quantitativo da populacao acompanhada
              </h2>
            </div>

            <p className="text-sm text-muted">{dashboardData.view.filteredRecordCount} registros no recorte atual</p>
          </div>

          <form className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-accent-strong">Condicao</span>
              <select
                name="condition"
                defaultValue={dashboardData.view.appliedFilters.condition}
                className="h-11 rounded-2xl border border-border bg-white px-4 text-foreground outline-none transition focus:border-accent"
              >
                <option value="ALL">Diabetes + hipertensao</option>
                <option value="DIABETES">Somente diabetes</option>
                <option value="HYPERTENSION">Somente hipertensao</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-accent-strong">Sexo</span>
              <select
                name="sex"
                defaultValue={dashboardData.view.appliedFilters.sex ?? ""}
                className="h-11 rounded-2xl border border-border bg-white px-4 text-foreground outline-none transition focus:border-accent"
              >
                <option value="">Todos</option>
                {dashboardData.view.filterOptions.sexes.map((sex) => (
                  <option key={sex} value={sex}>
                    {sex}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-accent-strong">Raca/cor</span>
              <select
                name="raceColor"
                defaultValue={dashboardData.view.appliedFilters.raceColor ?? ""}
                className="h-11 rounded-2xl border border-border bg-white px-4 text-foreground outline-none transition focus:border-accent"
              >
                <option value="">Todas</option>
                {dashboardData.view.filterOptions.raceColors.map((raceColor) => (
                  <option key={raceColor} value={raceColor}>
                    {raceColor}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-accent-strong">Faixa etaria</span>
              <select
                name="ageGroup"
                defaultValue={dashboardData.view.appliedFilters.ageGroup}
                className="h-11 rounded-2xl border border-border bg-white px-4 text-foreground outline-none transition focus:border-accent"
              >
                <option value="ALL">Todas</option>
                {AGE_GROUPS.map((ageGroup) => (
                  <option key={ageGroup} value={ageGroup}>
                    {ageGroup}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-accent-strong">Bairro</span>
              <select
                name="neighborhood"
                defaultValue={dashboardData.view.appliedFilters.neighborhood ?? ""}
                className="h-11 rounded-2xl border border-border bg-white px-4 text-foreground outline-none transition focus:border-accent"
              >
                <option value="">Todos</option>
                {dashboardData.view.filterOptions.neighborhoods.map((neighborhood) => (
                  <option key={neighborhood} value={neighborhood}>
                    {neighborhood}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-accent-strong">Bolsa Familia</span>
              <select
                name="familyAllowance"
                defaultValue={dashboardData.view.appliedFilters.familyAllowance}
                className="h-11 rounded-2xl border border-border bg-white px-4 text-foreground outline-none transition focus:border-accent"
              >
                <option value="ALL">Todos</option>
                <option value="YES">Somente sim</option>
                <option value="NO">Somente nao</option>
              </select>
            </label>

            <div className="md:col-span-2 xl:col-span-6 flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong"
              >
                Aplicar filtros
              </button>
              <Link
                href={createQueryString(DEFAULT_FILTERS, {})}
                className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-accent-strong transition hover:bg-surface-strong"
              >
                Resetar
              </Link>
            </div>
          </form>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <ChartCard
            title="Distribuicao"
            subtitle="Diabetes versus hipertensao"
            items={dashboardData.view.conditionDistribution}
          />
          <ChartCard
            title="Territorio"
            subtitle="Bairros com maior volume"
            items={dashboardData.view.topNeighborhoods}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <ChartCard
            title="Faixa etaria"
            subtitle="Composicao do recorte"
            items={dashboardData.view.ageGroupDistribution}
          />
          <ChartCard
            title="Sexo"
            subtitle="Distribuicao declarada"
            items={dashboardData.view.sexDistribution}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <ChartCard
            title="Raca/cor"
            subtitle="Distribuicao declarada"
            items={dashboardData.view.raceColorDistribution}
          />
          <section className={CARD_CLASS_NAME}>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">Cobertura</p>
              <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
                Indicadores do cuidado no recorte atual
              </h2>
            </div>

            <div className="mt-6 space-y-4">
              {dashboardData.view.careCoverage.map((item) => (
                <div key={item.label} className="rounded-[1.25rem] border border-border/70 bg-white p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-accent-strong">{item.label}</p>
                    <p className="text-sm text-muted">{item.coverageRate}% em dia</p>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-strong">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${item.coverageRate}%` }}
                    />
                  </div>
                  <div className="mt-3 flex justify-between text-xs text-muted">
                    <span>Em dia: {item.covered}</span>
                    <span>Em atraso: {item.uncovered}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>
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
          { label: "Hipertensao", value: 0 },
        ],
        topNeighborhoods: [],
        ageGroupDistribution: [],
        sexDistribution: [],
        raceColorDistribution: [],
        careCoverage: [
          { label: "Atendimento medico em dia", covered: 0, uncovered: 0, coverageRate: 0 },
          { label: "Enfermagem em dia", covered: 0, uncovered: 0, coverageRate: 0 },
          { label: "Visita domiciliar em dia", covered: 0, uncovered: 0, coverageRate: 0 },
          { label: "PA recente", covered: 0, uncovered: 0, coverageRate: 0 },
          { label: "HbA1c recente", covered: 0, uncovered: 0, coverageRate: 0 },
        ],
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
