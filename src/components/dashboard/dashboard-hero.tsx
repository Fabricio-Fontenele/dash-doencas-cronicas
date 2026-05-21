import Link from "next/link";

import { type DashboardFiltersDTO } from "@/application/dtos/DashboardFiltersDTO";
import {
  DEFAULT_FILTERS,
  PANEL_CLASS_NAME,
} from "@/presentation/dashboard/constants";
import {
  createDashboardQueryString,
  removeDashboardFilterValue,
} from "@/presentation/dashboard/filters";
import { type DashboardPageViewModel } from "@/presentation/dashboard/view-model";

export function DashboardHero({
  pageView,
}: {
  pageView: DashboardPageViewModel;
}) {
  return (
    <header className={`${PANEL_CLASS_NAME} relative overflow-hidden p-5 sm:p-7 lg:p-9`}>
      <div className="absolute inset-y-0 right-0 hidden w-[32rem] bg-[radial-gradient(circle_at_center,rgba(69,156,215,0.20),transparent_68%)] lg:block" />
      <div className="relative flex flex-col gap-6 sm:gap-8 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <span className="inline-flex rounded-full border border-border bg-surface-strong px-4 py-1 text-sm font-medium text-accent-strong">
            Sala de situação crônica
          </span>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-accent-strong sm:mt-5 sm:text-5xl">
            Dashboard quantitativo com filtros facetados e leitura territorial do recorte importado.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted sm:mt-4 sm:text-base sm:leading-7">
            Os CSVs são convertidos em recortes anonimizados. Aqui o foco é volume,
            distribuição e lacunas assistenciais em {pageView.conditionContextLabel}, sem qualquer
            dado nominal.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/importar"
            className="inline-flex h-11 items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-semibold text-white transition hover:bg-accent sm:h-12 sm:px-6"
          >
            Importar novo arquivo
          </Link>
          <Link
            href={createDashboardQueryString(DEFAULT_FILTERS)}
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-accent-strong transition hover:bg-surface-strong sm:h-12 sm:px-6"
          >
            Limpar todos os filtros
          </Link>
        </div>
      </div>
    </header>
  );
}

export function DashboardSnapshotPanel({
  activeFilters,
  pageView,
}: {
  activeFilters: DashboardFiltersDTO;
  pageView: DashboardPageViewModel;
}) {
  return (
    <section className={`${PANEL_CLASS_NAME} p-4 sm:p-5`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            Arquivo atual
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
            {pageView.snapshotTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">{pageView.snapshotDescription}</p>
        </div>

        <div className="flex max-w-xl flex-wrap gap-2">
          {pageView.activeFilterChips.length === 0 ? (
            <span className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted">
              Nenhum filtro aplicado
            </span>
          ) : (
            pageView.activeFilterChips.map((chip) => (
              <Link
                key={`${chip.key}-${chip.value}`}
                href={createDashboardQueryString(
                  removeDashboardFilterValue(activeFilters, chip.key, chip.value),
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
  );
}
