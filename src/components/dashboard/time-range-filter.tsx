"use client";

import { useState } from "react";

import { type TimeRangePreset } from "@/domain/value-objects/TimeRangePreset";
import { TIME_PRESET_OPTIONS } from "@/presentation/dashboard/constants";

export function TimeRangeFilter({
  defaultPreset,
  defaultStartDate,
  defaultEndDate,
}: {
  defaultPreset: TimeRangePreset;
  defaultStartDate: string | null;
  defaultEndDate: string | null;
}) {
  const [preset, setPreset] = useState<TimeRangePreset>(defaultPreset);
  const isCustom = preset === "CUSTOM";

  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-white/80 p-4">
      <label className="block text-sm font-semibold text-accent-strong" htmlFor="timePreset">
        Janela temporal
      </label>
      <select
        id="timePreset"
        name="timePreset"
        value={preset}
        onChange={(event) => {
          setPreset(event.target.value as TimeRangePreset);
        }}
        className="mt-3 h-11 w-full rounded-2xl border border-border/70 bg-white px-3 text-sm text-accent-strong"
      >
        {TIME_PRESET_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {isCustom ? (
        <div className="mt-4 grid gap-3">
          <label className="min-w-0 text-sm text-muted">
            <span className="mb-1 block font-medium text-accent-strong">Início</span>
            <input
              type="date"
              name="startDate"
              defaultValue={defaultStartDate ?? ""}
              className="h-11 w-full min-w-0 rounded-2xl border border-border/70 bg-white px-3 text-sm text-accent-strong"
            />
          </label>
          <label className="min-w-0 text-sm text-muted">
            <span className="mb-1 block font-medium text-accent-strong">Fim</span>
            <input
              type="date"
              name="endDate"
              defaultValue={defaultEndDate ?? ""}
              className="h-11 w-full min-w-0 rounded-2xl border border-border/70 bg-white px-3 text-sm text-accent-strong"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
