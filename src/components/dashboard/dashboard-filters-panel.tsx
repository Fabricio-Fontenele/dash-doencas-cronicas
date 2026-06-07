import Link from "next/link";

import { type DashboardViewDTO } from "@/application/dtos/DashboardViewDTO";
import { TimeRangeFilter } from "@/components/dashboard/time-range-filter";
import { AGE_GROUPS } from "@/domain/value-objects/AgeGroup";
import {
  CARE_GAP_OPTIONS,
  CONDITION_OPTIONS,
  DEFAULT_FILTERS,
  FAMILY_ALLOWANCE_OPTIONS,
  PANEL_CLASS_NAME,
} from "@/presentation/dashboard/constants";
import { createDashboardQueryString } from "@/presentation/dashboard/filters";

function FilterGroup({
  title,
  name,
  options,
  selectedValues,
  compact = false,
  defaultOpen = false,
}: {
  title: string;
  name: string;
  options: Array<{ value: string; label: string; helper?: string }>;
  selectedValues: string[];
  compact?: boolean;
  defaultOpen?: boolean;
}) {
  const selectedCount = selectedValues.length;

  return (
    <details
      open={defaultOpen || selectedCount > 0}
      className="group rounded-[1.5rem] border border-border/70 bg-white/80 p-4 open:border-accent/40"
    >
      <summary className="cursor-pointer list-none text-sm font-semibold text-accent-strong">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span>{title}</span>
            {selectedCount > 0 ? (
              <span className="rounded-full bg-accent-strong px-2 py-0.5 text-xs font-semibold text-white">
                {selectedCount}
              </span>
            ) : null}
          </div>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-4 shrink-0 text-muted transition group-open:rotate-180"
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

export function DashboardFiltersPanel({ view }: { view: DashboardViewDTO }) {
  return <DashboardFiltersPanelContent view={view} variant="sidebar" />;
}

export function DashboardFiltersPanelContent({
  view,
  variant,
}: {
  view: DashboardViewDTO;
  variant: "sidebar" | "drawer";
}) {
  const isDrawer = variant === "drawer";

  return (
    <section
      className={`${PANEL_CLASS_NAME} p-5 ${
        isDrawer
          ? "h-full max-h-full overflow-y-auto rounded-[1.5rem] p-4 sm:p-5"
          : "sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto"
      }`}
    >
      {!isDrawer ? (
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Filtros
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-accent-strong">Monte o recorte</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Os filtros demográficos afetam população, séries temporais e estratificações
              clínicas.
            </p>
          </div>
          <div className="rounded-full bg-surface-strong px-3 py-1 text-xs font-semibold text-muted">
            {view.filteredRecordCount} registros
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-end">
          <div className="rounded-full bg-surface-strong px-3 py-1 text-xs font-semibold text-muted">
            {view.filteredRecordCount} registros
          </div>
        </div>
      )}

      <form method="get" className="mt-4 space-y-4 pb-3 sm:mt-6">
        <TimeRangeFilter
          defaultPreset={view.appliedFilters.timePreset}
          defaultStartDate={view.appliedFilters.startDate}
          defaultEndDate={view.appliedFilters.endDate}
        />

        <FilterGroup
          title="Condição"
          name="condition"
          compact
          defaultOpen
          selectedValues={view.appliedFilters.conditions}
          options={CONDITION_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
            helper: option.helper,
          }))}
        />

        <FilterGroup
          title="Sexo"
          name="sex"
          compact
          selectedValues={view.appliedFilters.sexes}
          options={view.filterOptions.sexes.map((value) => ({ value, label: value }))}
        />

        <FilterGroup
          title="Raça/cor"
          name="raceColor"
          selectedValues={view.appliedFilters.raceColors}
          options={view.filterOptions.raceColors.map((value) => ({ value, label: value }))}
        />

        <FilterGroup
          title="Faixa etária"
          name="ageGroup"
          compact
          selectedValues={view.appliedFilters.ageGroups}
          options={AGE_GROUPS.map((value) => ({ value, label: value }))}
        />

        <FilterGroup
          title="Bolsa Família"
          name="familyAllowance"
          compact
          selectedValues={view.appliedFilters.familyAllowances}
          options={FAMILY_ALLOWANCE_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />

        <FilterGroup
          title="Lacunas do cuidado"
          name="careGap"
          selectedValues={view.appliedFilters.careGaps}
          options={CARE_GAP_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />

        <FilterGroup
          title="Profissional / evento"
          name="profession"
          compact
          selectedValues={view.appliedFilters.professions}
          options={view.filterOptions.professions.map((value) => ({
            value,
            label:
              value === "MEDICAL"
                ? "Médico"
                : value === "NURSING"
                  ? "Enfermagem"
                  : value === "DENTAL"
                    ? "Odontologia"
                    : "Visita domiciliar",
          }))}
        />

        <FilterGroup
          title="Bairro"
          name="neighborhood"
          selectedValues={view.appliedFilters.neighborhoods}
          options={view.filterOptions.neighborhoods.map((value) => ({ value, label: value }))}
        />

        <div className="sticky bottom-0 flex flex-col gap-3 border-t border-border/60 bg-[linear-gradient(180deg,rgba(244,243,243,0),rgba(244,243,243,0.96)_28%,rgba(244,243,243,0.99))] pt-4 sm:flex-row sm:flex-wrap">
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-semibold text-white transition hover:bg-accent sm:min-w-[11rem]"
          >
            Aplicar recorte
          </button>
          <Link
            href={createDashboardQueryString(DEFAULT_FILTERS)}
            className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-white px-5 text-sm font-semibold text-accent-strong transition hover:bg-surface-strong sm:min-w-[10rem]"
          >
            Resetar
          </Link>
        </div>
      </form>
    </section>
  );
}
