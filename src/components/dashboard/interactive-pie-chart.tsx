"use client";

import { useState } from "react";

interface PieChartItem {
  color: string;
  label: string;
  value: number;
}

interface InteractivePieChartProps {
  items: PieChartItem[];
  subtitle: string;
  title: string;
  totalLabel?: string;
}

interface HoverState {
  item: PieChartItem;
  x: number;
  y: number;
}

const SVG_SIZE = 240;
const CENTER = SVG_SIZE / 2;
const RADIUS = 92;

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(startAngle: number, endAngle: number) {
  const start = polarToCartesian(CENTER, CENTER, RADIUS, endAngle);
  const end = polarToCartesian(CENTER, CENTER, RADIUS, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${CENTER} ${CENTER}`,
    `L ${start.x} ${start.y}`,
    `A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

export function InteractivePieChart({
  items,
  subtitle,
  title,
  totalLabel = "Total",
}: InteractivePieChartProps) {
  const [hovered, setHovered] = useState<HoverState | null>(null);
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const segments = items.reduce<
    Array<{ endAngle: number; item: PieChartItem; startAngle: number }>
  >((result, item) => {
    const startAngle = result[result.length - 1]?.endAngle ?? 0;
    const sweepAngle = (item.value / total) * 360;
    const endAngle = startAngle + sweepAngle;

    return [...result, { item, startAngle, endAngle }];
  }, []);

  if (items.length === 0 || total === 0) {
    return (
      <section className="rounded-[1.75rem] border border-border/70 bg-surface p-5 shadow-[0_18px_60px_rgba(49,92,66,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">{title}</p>
        <h2 className="mt-2 text-2xl font-semibold text-accent-strong">{subtitle}</h2>
        <p className="mt-6 text-sm text-muted">Sem dados para este recorte.</p>
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-border/70 bg-surface p-5 shadow-[0_18px_60px_rgba(49,92,66,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">{title}</p>
      <h2 className="mt-2 text-2xl font-semibold text-accent-strong">{subtitle}</h2>

      <div className="mt-6 flex flex-col items-center">
        <div className="relative">
          <svg
            aria-label={subtitle}
            className="size-[15rem]"
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          >
            {segments.map(({ item, startAngle, endAngle }) => {
              const path = describeArc(startAngle, endAngle);

              return (
                <path
                  key={item.label}
                  d={path}
                  fill={item.color}
                  className="cursor-pointer transition-opacity hover:opacity-85"
                  onMouseEnter={(event) => {
                    const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();

                    if (!rect) {
                      return;
                    }

                    setHovered({
                      item,
                      x: event.clientX - rect.left,
                      y: event.clientY - rect.top,
                    });
                  }}
                  onMouseMove={(event) => {
                    const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();

                    if (!rect) {
                      return;
                    }

                    setHovered({
                      item,
                      x: event.clientX - rect.left,
                      y: event.clientY - rect.top,
                    });
                  }}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}
          </svg>

          {hovered ? (
            <div
              className="pointer-events-none absolute z-10 rounded-2xl border border-border bg-white px-3 py-2 text-xs shadow-[0_18px_40px_rgba(49,92,66,0.18)]"
              style={{
                left: Math.min(Math.max(hovered.x + 12, 8), SVG_SIZE - 124),
                top: Math.min(Math.max(hovered.y - 16, 8), SVG_SIZE - 70),
              }}
            >
              <p className="font-semibold text-accent-strong">{hovered.item.label}</p>
              <p className="mt-1 text-muted">
                {Math.round((hovered.item.value / total) * 100)}% • {hovered.item.value} pessoas
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {totalLabel}
          </span>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-accent-strong">{total}</p>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              <span
                className="block size-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium text-accent-strong">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
