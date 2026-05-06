import { type DashboardInsightDTO } from "@/application/dtos/DashboardViewDTO";
import {
  type DashboardNarrativeViewModel,
  type DashboardSummaryCardViewModel,
} from "@/presentation/dashboard/view-model";
import { SECTION_CLASS_NAME } from "@/presentation/dashboard/constants";

function StatCard({ eyebrow, value, label, accent }: DashboardSummaryCardViewModel) {
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

function InsightCard({ title, value, description, tone }: DashboardInsightDTO) {
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

export function DashboardSummaryGrid({ items }: { items: DashboardSummaryCardViewModel[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {items.map((item) => (
        <StatCard key={item.label} {...item} />
      ))}
    </section>
  );
}

export function DashboardInsightsSection({ items }: { items: DashboardInsightDTO[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
          Insights
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
          Leitura executiva para priorização
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {items.map((item) => (
          <InsightCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  );
}

export function DashboardNarrativeSection({
  narrative,
}: {
  narrative: DashboardNarrativeViewModel;
}) {
  return (
    <section className={SECTION_CLASS_NAME}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
        Leitura do recorte
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-accent-strong">{narrative.title}</h2>
      <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">{narrative.description}</p>
    </section>
  );
}
