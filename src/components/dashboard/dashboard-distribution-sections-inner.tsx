"use client";

import { cloneElement, useEffect, useRef, useState, type ReactElement } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  type DashboardBarChartItemDTO,
  type DashboardCoverageItemDTO,
  type DashboardProfessionalSeriesDTO,
  type DashboardTimelinePointDTO,
} from "@/application/dtos/DashboardViewDTO";
import { SECTION_CLASS_NAME } from "@/presentation/dashboard/constants";
import {
  getRaceColor,
  type DashboardAnalyticSupportViewModel,
  type DashboardSexChartItem,
} from "@/presentation/dashboard/view-model";

export interface DashboardDistributionSectionsProps {
  ageGroupDistribution: DashboardBarChartItemDTO[];
  bmiDistribution: DashboardBarChartItemDTO[];
  bloodPressureDistribution: DashboardBarChartItemDTO[];
  careByProfessional: DashboardProfessionalSeriesDTO[];
  conditionDistribution: DashboardBarChartItemDTO[];
  hba1cDistribution: DashboardBarChartItemDTO[];
  homeVisitTimeline: DashboardTimelinePointDTO[];
  raceColorDistribution: DashboardBarChartItemDTO[];
  sexChartItems: DashboardSexChartItem[];
  support: DashboardAnalyticSupportViewModel;
  topNeighborhoods: DashboardBarChartItemDTO[];
  visibleCoverageItems: DashboardCoverageItemDTO[];
}

function ChartShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${SECTION_CLASS_NAME} min-w-0`}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold text-accent-strong">{title}</h2>
      <div className="mt-6 min-w-0">{children}</div>
    </section>
  );
}

function ResponsiveChartFrame({
  children,
  heightClassName = "h-80",
}: {
  children: ReactElement<{ width?: number; height?: number }>;
  heightClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const nextWidth = Math.floor(entry.contentRect.width);
      const nextHeight = Math.floor(entry.contentRect.height);

      if (nextWidth > 0 && nextHeight > 0) {
        setSize((previous) => {
          if (previous && previous.width === nextWidth && previous.height === nextHeight) {
            return previous;
          }

          return { width: nextWidth, height: nextHeight };
        });
      }
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={`min-w-0 w-full ${heightClassName}`}>
      {size ? cloneElement(children, { width: size.width, height: size.height }) : null}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-white/50 px-4 py-10 text-center text-sm text-muted">
      {message}
    </div>
  );
}

function SexPieChart({ items }: { items: DashboardSexChartItem[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return <EmptyChart message="Sem composição por sexo para este recorte." />;
  }

  return (
    <ResponsiveChartFrame>
      <PieChart>
        <Pie data={items} dataKey="value" nameKey="label" innerRadius={68} outerRadius={102}>
          {items.map((item) => (
            <Cell key={item.label} fill={item.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveChartFrame>
  );
}

function SimpleBars({
  items,
  color,
  emptyMessage,
}: {
  items: DashboardBarChartItemDTO[];
  color: string;
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <EmptyChart message={emptyMessage} />;
  }

  return (
    <ResponsiveChartFrame>
      <BarChart data={items} layout="vertical" margin={{ left: 10, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,58,96,0.12)" />
        <XAxis type="number" stroke="#74818d" />
        <YAxis
          type="category"
          dataKey="label"
          width={110}
          stroke="#74818d"
          tick={{ fontSize: 12 }}
        />
        <Tooltip />
        <Bar dataKey="value" radius={[0, 12, 12, 0]} fill={color} />
      </BarChart>
    </ResponsiveChartFrame>
  );
}

function CoverageDeck({ items }: { items: DashboardCoverageItemDTO[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
  );
}

function ProfessionalTimeline({
  series,
  support,
}: {
  series: DashboardProfessionalSeriesDTO[];
  support: DashboardAnalyticSupportViewModel;
}) {
  const merged = series[0]?.points.map((point, index) => ({
    label: point.label,
    Medico: series.find((item) => item.profession === "MEDICAL")?.points[index]?.value ?? 0,
    Enfermagem:
      series.find((item) => item.profession === "NURSING")?.points[index]?.value ?? 0,
    Odontologia:
      series.find((item) => item.profession === "DENTAL")?.points[index]?.value ?? 0,
  })) ?? [];

  if (merged.length === 0) {
    return (
      <EmptyChart message="Sem eventos temporais agregados para os profissionais neste recorte." />
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid min-w-0 gap-3 md:grid-cols-3">
        {series.map((item) => (
          <article
            key={item.profession}
            className="rounded-[1.25rem] border border-border/70 bg-white/80 p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              {item.label}
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-accent-strong">
              {item.total}
            </p>
            <p className="mt-2 text-sm text-muted">
              {item.profession === "MEDICAL" && !support.supportsMedicalTimeline
                ? "Sem data exata suficiente neste arquivo."
                : item.profession === "NURSING" && !support.supportsNursingTimeline
                  ? "Sem data exata suficiente neste arquivo."
                  : item.profession === "DENTAL" && !support.supportsDentalTimeline
                    ? "Sem data exata suficiente neste arquivo."
                    : "Eventos contabilizados na janela atual."}
            </p>
          </article>
        ))}
      </div>

      <ResponsiveChartFrame>
        <LineChart data={merged}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,58,96,0.12)" />
          <XAxis dataKey="label" stroke="#74818d" />
          <YAxis stroke="#74818d" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="Medico" name="Médico" stroke="#143a60" strokeWidth={3} dot={false} />
          <Line
            type="monotone"
            dataKey="Enfermagem"
            name="Enfermagem"
            stroke="#459cd7"
            strokeWidth={3}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="Odontologia"
            name="Odontologia"
            stroke="#e8531e"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveChartFrame>
    </div>
  );
}

function HomeVisitTimeline({
  items,
  support,
}: {
  items: DashboardTimelinePointDTO[];
  support: DashboardAnalyticSupportViewModel;
}) {
  if (items.length === 0) {
    return <EmptyChart message="Sem série temporal agregada de visitas domiciliares para este recorte." />;
  }

  const data = items.map((item) => ({ label: item.label, value: item.value }));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {support.supportsHomeVisitTimeline
          ? "Série construída a partir das datas clínicas disponíveis de visitas domiciliares."
          : "O arquivo atual não sustenta uma série exata completa; os pontos abaixo refletem apenas os eventos com data clínica disponível."}
      </p>
      <ResponsiveChartFrame>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,58,96,0.12)" />
          <XAxis dataKey="label" stroke="#74818d" />
          <YAxis stroke="#74818d" />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#143a60"
            fill="rgba(69,156,215,0.30)"
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveChartFrame>
    </div>
  );
}

export function DashboardDistributionSectionsInner({
  ageGroupDistribution,
  bmiDistribution,
  bloodPressureDistribution,
  careByProfessional,
  conditionDistribution,
  hba1cDistribution,
  homeVisitTimeline,
  raceColorDistribution,
  sexChartItems,
  support,
  topNeighborhoods,
  visibleCoverageItems,
}: DashboardDistributionSectionsProps) {
  return (
    <>
      <section className="grid min-w-0 gap-4 2xl:grid-cols-[1.2fr_0.8fr]">
        <ChartShell eyebrow="Produção assistencial" title="Atendimentos realizados por profissional">
          <ProfessionalTimeline series={careByProfessional} support={support} />
        </ChartShell>
        <ChartShell eyebrow="Visitas domiciliares" title="Série temporal do recorte atual">
          <HomeVisitTimeline items={homeVisitTimeline} support={support} />
        </ChartShell>
      </section>

      <section className="grid min-w-0 gap-4 2xl:grid-cols-[0.8fr_1.2fr]">
        <ChartShell eyebrow="Sexo" title="Composição do recorte por sexo">
          <SexPieChart items={sexChartItems} />
        </ChartShell>
        <ChartShell eyebrow="Faixa etária" title="Distribuição por faixa etária">
          <SimpleBars
            items={ageGroupDistribution}
            color="#e8531e"
            emptyMessage="Sem distribuição etária para este recorte."
          />
        </ChartShell>
      </section>

      <section className="grid min-w-0 gap-4 2xl:grid-cols-[1fr_1fr]">
        <ChartShell eyebrow="Raça/cor original" title="Leitura fiel do valor importado">
          {raceColorDistribution.length === 0 ? (
            <EmptyChart message="Sem dados originais de raça/cor para este recorte." />
          ) : (
            <ResponsiveChartFrame>
              <PieChart>
                <Pie data={raceColorDistribution} dataKey="value" nameKey="label" innerRadius={60} outerRadius={100}>
                  {raceColorDistribution.map((item) => (
                    <Cell key={item.label} fill={getRaceColor(item.label)} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveChartFrame>
          )}
        </ChartShell>
        <ChartShell eyebrow="Território" title="Bairros com maior volume acompanhado">
          <SimpleBars
            items={topNeighborhoods}
            color="#143a60"
            emptyMessage="Sem concentração territorial para este recorte."
          />
        </ChartShell>
      </section>

      <ChartShell eyebrow="Cobertura" title="Equilíbrio entre acompanhamento em dia e em atraso">
        <CoverageDeck items={visibleCoverageItems} />
      </ChartShell>

      <section className="grid min-w-0 gap-4 2xl:grid-cols-3">
        <ChartShell eyebrow="IMC" title="Classificação por IMC segundo a OMS">
          <SimpleBars
            items={bmiDistribution}
            color="#143a60"
            emptyMessage="Sem peso e altura suficientes para classificar IMC."
          />
        </ChartShell>
        <ChartShell eyebrow="Pressão arterial" title="Classificação de PA para hipertensos">
          <SimpleBars
            items={bloodPressureDistribution}
            color="#e8531e"
            emptyMessage="Sem pressão arterial suficiente para classificar hipertensão."
          />
        </ChartShell>
        <ChartShell eyebrow="Hemoglobina glicada" title="Classificação clínica de HbA1c em diabéticos">
          <SimpleBars
            items={hba1cDistribution}
            color="#459cd7"
            emptyMessage="Sem resultado suficiente de HbA1c para classificar o recorte."
          />
        </ChartShell>
      </section>

      <section className="grid min-w-0 gap-4">
        <ChartShell eyebrow="Condição" title="Distribuição entre diabetes e hipertensão">
          <SimpleBars
            items={conditionDistribution}
            color="#7a94ad"
            emptyMessage="Sem dados de condição para este recorte."
          />
        </ChartShell>
      </section>
    </>
  );
}
