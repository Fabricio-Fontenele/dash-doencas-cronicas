"use client";

import { useEffect, useId, useState } from "react";

import { type DashboardViewDTO } from "@/application/dtos/DashboardViewDTO";
import {
  DashboardFiltersPanel,
  DashboardFiltersPanelContent,
} from "@/components/dashboard/dashboard-filters-panel";

function countAppliedFilters(view: DashboardViewDTO): number {
  const { appliedFilters } = view;

  return (
    appliedFilters.conditions.length +
    appliedFilters.sexes.length +
    appliedFilters.raceColors.length +
    appliedFilters.neighborhoods.length +
    appliedFilters.familyAllowances.length +
    appliedFilters.ageGroups.length +
    appliedFilters.careGaps.length +
    appliedFilters.professions.length +
    (appliedFilters.timePreset === "LAST_6_MONTHS" ? 0 : 1) +
    (appliedFilters.startDate ? 1 : 0) +
    (appliedFilters.endDate ? 1 : 0)
  );
}

export function DashboardFiltersShell({ view }: { view: DashboardViewDTO }) {
  const [isOpen, setIsOpen] = useState(false);
  const drawerId = useId();
  const appliedFilterCount = countAppliedFilters(view);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <>
      <div className="xl:hidden">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={drawerId}
          onClick={() => {
            setIsOpen(true);
          }}
          className="inline-flex w-full items-center justify-between rounded-[1.5rem] border border-border/70 bg-white/85 px-4 py-3 text-left shadow-[0_12px_40px_rgba(20,58,96,0.08)] backdrop-blur"
        >
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Filtros
            </span>
            <span className="mt-1 block text-base font-semibold text-accent-strong">
              Ajustar recorte
            </span>
          </span>
          <span className="inline-flex items-center gap-3">
            <span className="rounded-full bg-surface-strong px-3 py-1 text-xs font-semibold text-muted">
              {appliedFilterCount} ativos
            </span>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="size-5 text-accent-strong"
              fill="none"
            >
              <path
                d="m7.5 5 5 5-5 5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </span>
        </button>
      </div>

      <aside className="hidden space-y-6 xl:block">
        <DashboardFiltersPanel view={view} />
      </aside>

      {isOpen ? (
        <div className="xl:hidden">
          <button
            type="button"
            aria-label="Fechar filtros"
            className="fixed inset-0 z-40 bg-[rgba(20,58,96,0.35)] backdrop-blur-[2px]"
            onClick={() => {
              setIsOpen(false);
            }}
          />

          <div
            id={drawerId}
            role="dialog"
            aria-modal="true"
            aria-label="Filtros da dashboard"
            className="fixed inset-y-0 right-0 z-50 w-full max-w-[28rem] p-3 sm:p-4"
          >
            <div className="flex h-full flex-col rounded-[2rem] bg-[linear-gradient(180deg,rgba(244,243,243,0.98),rgba(214,231,244,0.98))] shadow-[0_30px_80px_rgba(20,58,96,0.22)]">
              <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                    Filtros
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-accent-strong">
                    Monte o recorte
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="Fechar filtros"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-border/70 bg-white text-accent-strong"
                >
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="none">
                    <path
                      d="M6 6l8 8M14 6l-8 8"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                </button>
              </div>

              <div className="min-h-0 flex-1 p-2">
                <DashboardFiltersPanelContent view={view} variant="drawer" />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
