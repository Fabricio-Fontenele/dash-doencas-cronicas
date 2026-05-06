import {
  type DashboardBarChartItemDTO,
  type DashboardCoverageItemDTO,
} from "@/application/dtos/DashboardViewDTO";
import { InteractivePieChart } from "@/components/dashboard/interactive-pie-chart";
import { SECTION_CLASS_NAME } from "@/presentation/dashboard/constants";
import {
  getRaceColor,
  type DashboardSexChartItem,
} from "@/presentation/dashboard/view-model";

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
              <p className="mt-1 text-3xl font-semibold tracking-tight text-accent-strong">
                {item.value}
              </p>
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
    .reduce<Array<{ start: number; end: number; color: string }>>((segments, item) => {
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
    }, [])
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
                  <span className="truncate text-sm font-medium text-accent-strong">
                    {item.label}
                  </span>
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
              <div className="bg-accent-strong" style={{ width: `${item.coverageRate}%` }} />
              <div className="bg-highlight" style={{ width: `${100 - item.coverageRate}%` }} />
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

export function DashboardDistributionSections({
  ageGroupDistribution,
  conditionDistribution,
  hasMixedConditions,
  raceColorDistribution,
  sexChartItems,
  topNeighborhoods,
  visibleCoverageItems,
}: {
  ageGroupDistribution: DashboardBarChartItemDTO[];
  conditionDistribution: DashboardBarChartItemDTO[];
  hasMixedConditions: boolean;
  raceColorDistribution: DashboardBarChartItemDTO[];
  sexChartItems: DashboardSexChartItem[];
  topNeighborhoods: DashboardBarChartItemDTO[];
  visibleCoverageItems: DashboardCoverageItemDTO[];
}) {
  return (
    <>
      <section
        className={`grid gap-4 ${hasMixedConditions ? "2xl:grid-cols-[1.1fr_0.9fr]" : "2xl:grid-cols-1"}`}
      >
        <HorizontalBars
          title="Território"
          subtitle="Top bairros com mais pessoas acompanhadas"
          items={topNeighborhoods}
          tone="bg-[linear-gradient(90deg,#459cd7_0%,#143a60_100%)]"
        />
        {hasMixedConditions ? (
          <ComparisonColumns
            title="Condição"
            subtitle="Distribuição entre diabetes e hipertensão"
            items={conditionDistribution}
          />
        ) : null}
      </section>

      <section className="grid gap-4 2xl:grid-cols-[0.9fr_1.1fr]">
        <InteractivePieChart
          title="Sexo"
          subtitle="Composição do recorte por sexo"
          items={sexChartItems}
          totalLabel="Total"
        />
        <HorizontalBars
          title="Faixa etária"
          subtitle="Distribuição por faixa etária"
          items={ageGroupDistribution}
          tone="bg-highlight"
        />
      </section>

      <section className="grid gap-4 2xl:grid-cols-[1fr_1fr]">
        <PieChart
          title="Raça/cor"
          subtitle="Composição do recorte por raça/cor"
          items={raceColorDistribution}
          getColor={getRaceColor}
          donut
        />
        <CoverageDeck items={visibleCoverageItems} />
      </section>
    </>
  );
}
