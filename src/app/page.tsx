import Link from "next/link";

import { type DashboardResumoDTO } from "@/application/dtos/DashboardResumoDTO";
import { type DashboardVisaoDTO } from "@/application/dtos/DashboardVisaoDTO";
import {
  type AlertaFiltro,
  type FiltrosDashboardDTO,
} from "@/application/dtos/FiltrosDashboardDTO";
import { type UploadHistoricoDTO } from "@/application/dtos/UploadHistoricoDTO";
import { GerarDashboardVisaoUseCase } from "@/application/use-cases/dashboard/GerarDashboardVisaoUseCase";
import { ListarUploadsUseCase } from "@/application/use-cases/upload/ListarUploadsUseCase";
import { PrismaPacienteRepository } from "@/infrastructure/database/repositories/PrismaPacienteRepository";
import { PrismaUploadRepository } from "@/infrastructure/database/repositories/PrismaUploadRepository";

export const dynamic = "force-dynamic";

const CARD_CLASSNAME = [
  "rounded-[1.75rem] border border-border bg-surface p-5",
  "shadow-[0_20px_50px_rgba(49,92,66,0.08)]",
].join(" ");

const EMPTY_RESUMO: DashboardResumoDTO = {
  totalPacientes: 0,
  semAtendimentoMedico: 0,
  semAtendimentoEnfermagem: 0,
  semVisitaDomiciliar: 0,
  semMedicaoPressaoRecente: 0,
  semHbA1cRecente: 0,
  totalDiabetes: 0,
  totalHipertensao: 0,
};

const DEFAULT_FILTERS: FiltrosDashboardDTO = {
  condicao: "TODOS",
  sexo: null,
  racaCor: null,
  bairro: null,
  bolsaFamilia: "TODOS",
  faixaEtaria: "TODAS",
  busca: "",
  alerta: null,
  minMesesMedico: 0,
  minMesesEnfermagem: 0,
  minMesesVisita: 0,
  page: 1,
  pageSize: 8,
  sortBy: "risk",
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

function createQueryString(
  filters: FiltrosDashboardDTO,
  overrides: Partial<FiltrosDashboardDTO>,
): string {
  const next = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (next.condicao !== "TODOS") params.set("condicao", next.condicao);
  if (next.sexo) params.set("sexo", next.sexo);
  if (next.racaCor) params.set("racaCor", next.racaCor);
  if (next.bairro) params.set("bairro", next.bairro);
  if (next.bolsaFamilia !== "TODOS") params.set("bolsaFamilia", next.bolsaFamilia);
  if (next.faixaEtaria !== "TODAS") params.set("faixaEtaria", next.faixaEtaria);
  if (next.busca.trim()) params.set("busca", next.busca.trim());
  if (next.alerta) params.set("alerta", next.alerta);
  if (next.minMesesMedico > 0) params.set("minMesesMedico", String(next.minMesesMedico));
  if (next.minMesesEnfermagem > 0) params.set("minMesesEnfermagem", String(next.minMesesEnfermagem));
  if (next.minMesesVisita > 0) params.set("minMesesVisita", String(next.minMesesVisita));
  if (next.page > 1) params.set("page", String(next.page));
  if (next.sortBy !== "risk") params.set("sortBy", next.sortBy);

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function parseSingleValue(value: SearchParamValue): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function parseFilters(
  searchParams: Record<string, SearchParamValue>,
): FiltrosDashboardDTO {
  const condicao = parseSingleValue(searchParams.condicao);
  const sexo = parseSingleValue(searchParams.sexo);
  const racaCor = parseSingleValue(searchParams.racaCor);
  const bairro = parseSingleValue(searchParams.bairro);
  const bolsaFamilia = parseSingleValue(searchParams.bolsaFamilia);
  const faixaEtaria = parseSingleValue(searchParams.faixaEtaria);
  const busca = parseSingleValue(searchParams.busca) ?? "";
  const alerta = parseSingleValue(searchParams.alerta);
  const minMesesMedico = Number.parseInt(parseSingleValue(searchParams.minMesesMedico) ?? "0", 10);
  const minMesesEnfermagem = Number.parseInt(parseSingleValue(searchParams.minMesesEnfermagem) ?? "0", 10);
  const minMesesVisita = Number.parseInt(parseSingleValue(searchParams.minMesesVisita) ?? "0", 10);
  const page = Number.parseInt(parseSingleValue(searchParams.page) ?? "1", 10);
  const sortBy = parseSingleValue(searchParams.sortBy);

  return {
    condicao:
      condicao === "DIABETES" || condicao === "HIPERTENSAO"
        ? condicao
        : DEFAULT_FILTERS.condicao,
    sexo: sexo || null,
    racaCor: racaCor || null,
    bairro: bairro || null,
    bolsaFamilia:
      bolsaFamilia === "SIM" || bolsaFamilia === "NAO"
        ? bolsaFamilia
        : DEFAULT_FILTERS.bolsaFamilia,
    faixaEtaria:
      faixaEtaria === "0-17" ||
      faixaEtaria === "18-39" ||
      faixaEtaria === "40-59" ||
      faixaEtaria === "60-79" ||
      faixaEtaria === "80+"
        ? faixaEtaria
        : DEFAULT_FILTERS.faixaEtaria,
    busca,
    alerta:
      alerta === "medical" ||
      alerta === "nursing" ||
      alerta === "home-visit" ||
      alerta === "blood-pressure" ||
      alerta === "hba1c"
        ? alerta
        : DEFAULT_FILTERS.alerta,
    minMesesMedico:
      Number.isFinite(minMesesMedico) && minMesesMedico > 0 ? minMesesMedico : 0,
    minMesesEnfermagem:
      Number.isFinite(minMesesEnfermagem) && minMesesEnfermagem > 0 ? minMesesEnfermagem : 0,
    minMesesVisita:
      Number.isFinite(minMesesVisita) && minMesesVisita > 0 ? minMesesVisita : 0,
    page: Number.isFinite(page) && page > 0 ? page : DEFAULT_FILTERS.page,
    pageSize: DEFAULT_FILTERS.pageSize,
    sortBy:
      sortBy === "name" ||
      sortBy === "condition" ||
      sortBy === "neighborhood" ||
      sortBy === "risk" ||
      sortBy === "age" ||
      sortBy === "medical-delay"
        ? sortBy
        : DEFAULT_FILTERS.sortBy,
  };
}

function getSummaryCardConfig(
  resumo: DashboardResumoDTO,
): Array<{
  label: string;
  value: number;
  alerta: AlertaFiltro | null;
}> {
  return [
    {
      label: "Total de pacientes",
      value: resumo.totalPacientes,
      alerta: null,
    },
    {
      label: "Sem atendimento medico > 6 meses",
      value: resumo.semAtendimentoMedico,
      alerta: "medical",
    },
    {
      label: "Sem enfermagem > 6 meses",
      value: resumo.semAtendimentoEnfermagem,
      alerta: "nursing",
    },
    {
      label: "Sem visita domiciliar > 3 meses",
      value: resumo.semVisitaDomiciliar,
      alerta: "home-visit",
    },
    {
      label: "Sem medicao de PA recente",
      value: resumo.semMedicaoPressaoRecente,
      alerta: "blood-pressure",
    },
    {
      label: "Sem HbA1c recente",
      value: resumo.semHbA1cRecente,
      alerta: "hba1c",
    },
  ];
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const filtros = parseFilters(params);
  const dashboardData = await loadDashboardData(filtros);
  const summaryCards = getSummaryCardConfig(dashboardData.visao.resumo);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#eef5e5_0%,#f4f1e8_34%,#ebe1ce_100%)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-10">
        <header className="relative overflow-hidden rounded-[2rem] border border-border bg-surface p-7 shadow-[0_28px_80px_rgba(49,92,66,0.10)]">
          <div className="absolute inset-y-0 right-0 hidden w-[34%] bg-[radial-gradient(circle_at_center,rgba(49,92,66,0.18),transparent_70%)] lg:block" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-border bg-surface-strong px-4 py-1 text-sm font-medium text-accent-strong">
                Modo apresentacao
              </span>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-accent-strong sm:text-5xl">
                Panorama clinico do ultimo snapshot importado.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
                Dashboard narrativo para demonstracao, com filtros reais, indicadores acionaveis,
                leitura do ultimo upload e foco em pacientes com cuidado em atraso.
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
            O banco nao esta acessivel nesta execucao. O painel continua pronto para a apresentacao,
            mas os dados so aparecem quando o PostgreSQL estiver disponivel.
          </section>
        ) : null}

        {dashboardData.ultimoUpload ? (
          <section className={CARD_CLASSNAME}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
                  Ultimo upload
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
                  {dashboardData.ultimoUpload.fileName}
                </h2>
              </div>

              <div className="grid gap-3 text-sm text-muted sm:grid-cols-3">
                <div>
                  <p className="font-medium text-accent-strong">Condicao</p>
                  <p>{dashboardData.ultimoUpload.condicao}</p>
                </div>
                <div>
                  <p className="font-medium text-accent-strong">Responsavel</p>
                  <p>{dashboardData.ultimoUpload.uploadedBy}</p>
                </div>
                <div>
                  <p className="font-medium text-accent-strong">Momento</p>
                  <p>{formatUploadDate(dashboardData.ultimoUpload.createdAt)}</p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => {
            const href = createQueryString(dashboardData.visao.filtrosAplicados, {
              alerta:
                dashboardData.visao.filtrosAplicados.alerta === card.alerta
                  ? null
                  : card.alerta,
              page: 1,
            });
            const isActive =
              card.alerta !== null &&
              dashboardData.visao.filtrosAplicados.alerta === card.alerta;

            return (
              <Link
                key={card.label}
                href={href}
                className={`${CARD_CLASSNAME} transition hover:-translate-y-0.5 ${
                  isActive ? "ring-2 ring-accent/40" : ""
                }`}
              >
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">
                  {card.label}
                </p>
                <p className="mt-4 text-4xl font-semibold text-accent-strong">
                  {card.value}
                </p>
                <p className="mt-3 text-xs text-muted">
                  {card.alerta ? "Clique para destacar este risco na tabela." : "Visao agregada atual."}
                </p>
              </Link>
            );
          })}
        </section>

        <section className={CARD_CLASSNAME}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
                Filtros ativos
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
                Refine o recorte para a apresentacao
              </h2>
            </div>

            <p className="text-sm text-muted">
              {dashboardData.visao.totalPacientesFiltrados} pacientes no recorte atual
            </p>
          </div>

          <form className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-8">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-accent-strong">Busca</span>
              <input
                type="text"
                name="busca"
                defaultValue={dashboardData.visao.filtrosAplicados.busca}
                placeholder="Nome ou ID"
                className="h-11 rounded-2xl border border-border bg-white px-4 text-foreground outline-none transition focus:border-accent"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-accent-strong">Condicao</span>
              <select
                name="condicao"
                defaultValue={dashboardData.visao.filtrosAplicados.condicao}
                className="h-11 rounded-2xl border border-border bg-white px-4 text-foreground outline-none transition focus:border-accent"
              >
                <option value="TODOS">Todos</option>
                <option value="DIABETES">Diabetes</option>
                <option value="HIPERTENSAO">Hipertensao</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-accent-strong">Sexo</span>
              <select
                name="sexo"
                defaultValue={dashboardData.visao.filtrosAplicados.sexo ?? ""}
                className="h-11 rounded-2xl border border-border bg-white px-4 text-foreground outline-none transition focus:border-accent"
              >
                <option value="">Todos</option>
                {dashboardData.visao.filterOptions.sexos.map((sexo) => (
                  <option key={sexo} value={sexo}>
                    {sexo}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-accent-strong">Raça/cor</span>
              <select
                name="racaCor"
                defaultValue={dashboardData.visao.filtrosAplicados.racaCor ?? ""}
                className="h-11 rounded-2xl border border-border bg-white px-4 text-foreground outline-none transition focus:border-accent"
              >
                <option value="">Todas</option>
                {dashboardData.visao.filterOptions.racas.map((raca) => (
                  <option key={raca} value={raca}>
                    {raca}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-accent-strong">Faixa etaria</span>
              <select
                name="faixaEtaria"
                defaultValue={dashboardData.visao.filtrosAplicados.faixaEtaria}
                className="h-11 rounded-2xl border border-border bg-white px-4 text-foreground outline-none transition focus:border-accent"
              >
                <option value="TODAS">Todas</option>
                <option value="0-17">0-17</option>
                <option value="18-39">18-39</option>
                <option value="40-59">40-59</option>
                <option value="60-79">60-79</option>
                <option value="80+">80+</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-accent-strong">Bairro</span>
              <select
                name="bairro"
                defaultValue={dashboardData.visao.filtrosAplicados.bairro ?? ""}
                className="h-11 rounded-2xl border border-border bg-white px-4 text-foreground outline-none transition focus:border-accent"
              >
                <option value="">Todos</option>
                {dashboardData.visao.filterOptions.bairros.map((bairro) => (
                  <option key={bairro} value={bairro}>
                    {bairro}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-accent-strong">Bolsa Familia</span>
              <select
                name="bolsaFamilia"
                defaultValue={dashboardData.visao.filtrosAplicados.bolsaFamilia}
                className="h-11 rounded-2xl border border-border bg-white px-4 text-foreground outline-none transition focus:border-accent"
              >
                <option value="TODOS">Todos</option>
                <option value="SIM">Sim</option>
                <option value="NAO">Nao</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-accent-strong">Min. meses medico</span>
              <input
                type="number"
                min="0"
                max="24"
                name="minMesesMedico"
                defaultValue={dashboardData.visao.filtrosAplicados.minMesesMedico}
                className="h-11 rounded-2xl border border-border bg-white px-4 text-foreground outline-none transition focus:border-accent"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-accent-strong">Min. meses enfermagem</span>
              <input
                type="number"
                min="0"
                max="24"
                name="minMesesEnfermagem"
                defaultValue={dashboardData.visao.filtrosAplicados.minMesesEnfermagem}
                className="h-11 rounded-2xl border border-border bg-white px-4 text-foreground outline-none transition focus:border-accent"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-accent-strong">Min. meses visita</span>
              <input
                type="number"
                min="0"
                max="24"
                name="minMesesVisita"
                defaultValue={dashboardData.visao.filtrosAplicados.minMesesVisita}
                className="h-11 rounded-2xl border border-border bg-white px-4 text-foreground outline-none transition focus:border-accent"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-accent-strong">Ordenacao</span>
              <select
                name="sortBy"
                defaultValue={dashboardData.visao.filtrosAplicados.sortBy}
                className="h-11 rounded-2xl border border-border bg-white px-4 text-foreground outline-none transition focus:border-accent"
              >
                <option value="risk">Maior risco</option>
                <option value="name">Nome</option>
                <option value="age">Maior idade</option>
                <option value="condition">Condicao</option>
                <option value="neighborhood">Bairro</option>
                <option value="medical-delay">Maior atraso medico</option>
              </select>
            </label>

            {dashboardData.visao.filtrosAplicados.alerta ? (
              <input
                type="hidden"
                name="alerta"
                value={dashboardData.visao.filtrosAplicados.alerta}
              />
            ) : null}

            <div className="flex gap-3 md:col-span-2 xl:col-span-8">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong"
              >
                Aplicar filtros
              </button>
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-accent-strong transition hover:bg-surface-strong"
              >
                Resetar
              </Link>
            </div>
          </form>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr]">
          <article className={CARD_CLASSNAME}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
                  Grafico 1
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
                  Top bairros com maior concentracao
                </h2>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {dashboardData.visao.topBairros.length === 0 ? (
                <p className="text-sm text-muted">Sem dados para o recorte atual.</p>
              ) : (
                dashboardData.visao.topBairros.map((item) => {
                  const maxValue = dashboardData.visao.topBairros[0]?.value ?? 1;
                  const width = `${(item.value / maxValue) * 100}%`;

                  return (
                    <div key={item.label} className="grid gap-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-accent-strong">{item.label}</span>
                        <span className="text-muted">{item.value}</span>
                      </div>
                      <div className="h-3 rounded-full bg-surface-strong">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-accent-strong),var(--color-accent))]"
                          style={{ width }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </article>

          <article className={CARD_CLASSNAME}>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
              Grafico 2
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
              Diabetes versus hipertensao
            </h2>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {dashboardData.visao.distribuicaoCondicao.map((item) => {
                const total =
                  dashboardData.visao.distribuicaoCondicao.reduce(
                    (sum, chartItem) => sum + chartItem.value,
                    0,
                  ) || 1;
                const percentage = Math.round((item.value / total) * 100);

                return (
                  <div
                    key={item.label}
                    className="rounded-[1.5rem] bg-surface-strong p-5 text-center"
                  >
                    <svg
                      viewBox="0 0 120 120"
                      className="mx-auto size-32"
                      aria-hidden="true"
                    >
                      <circle
                        cx="60"
                        cy="60"
                        r="42"
                        fill="none"
                        stroke="rgba(49,92,66,0.12)"
                        strokeWidth="12"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="42"
                        fill="none"
                        stroke="var(--color-accent)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${(percentage / 100) * 264} 264`}
                        transform="rotate(-90 60 60)"
                      />
                      <text
                        x="60"
                        y="64"
                        textAnchor="middle"
                        fontSize="20"
                        fill="var(--color-accent-strong)"
                        fontWeight="600"
                      >
                        {percentage}%
                      </text>
                    </svg>
                    <p className="mt-3 text-lg font-semibold text-accent-strong">
                      {item.label}
                    </p>
                    <p className="text-sm text-muted">{item.value} pacientes</p>
                  </div>
                );
              })}
            </div>
          </article>
        </section>

        <section className={CARD_CLASSNAME}>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
            Grafico 3
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
            Cobertura dos principais pontos de cuidado
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {dashboardData.visao.coberturaCuidado.map((item) => (
              <article
                key={item.label}
                className="rounded-[1.5rem] border border-border bg-white p-4"
              >
                <p className="text-sm font-medium text-accent-strong">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-accent-strong">
                  {Math.round(item.coverageRate)}%
                </p>
                <div className="mt-3 h-3 rounded-full bg-surface-strong">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#1e4130,#4e8a61)]"
                    style={{ width: `${Math.max(item.coverageRate, 4)}%` }}
                  />
                </div>
                <p className="mt-3 text-xs leading-5 text-muted">
                  {item.covered} em dia • {item.uncovered} em atraso
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className={CARD_CLASSNAME}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
                Tabela de pacientes
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
                Lista paginada do recorte filtrado
              </h2>
            </div>
            <p className="text-sm text-muted">
              Pagina {dashboardData.visao.paginaAtual} de {dashboardData.visao.totalPaginas}
            </p>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-border">
            <table className="w-full border-collapse">
              <thead className="bg-surface-strong text-left text-sm text-accent-strong">
                <tr>
                  <th className="px-4 py-3 font-semibold">Paciente</th>
                  <th className="px-4 py-3 font-semibold">Condicao</th>
                  <th className="px-4 py-3 font-semibold">Perfil</th>
                  <th className="px-4 py-3 font-semibold">Bairro</th>
                  <th className="px-4 py-3 font-semibold">Meses</th>
                  <th className="px-4 py-3 font-semibold">Alertas</th>
                </tr>
              </thead>
              <tbody className="bg-white text-sm text-foreground">
                {dashboardData.visao.pacientes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted">
                      Nenhum paciente encontrado para os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  dashboardData.visao.pacientes.map((paciente) => {
                    const flags = [
                      paciente.needsMedicalCare ? "Medico" : null,
                      paciente.needsNursingCare ? "Enfermagem" : null,
                      paciente.needsHomeVisit ? "Visita" : null,
                      paciente.hasStaleBloodPressureMeasurement ? "PA" : null,
                      paciente.hasStaleHbA1c ? "HbA1c" : null,
                    ].filter((value): value is string => value !== null);

                    return (
                      <tr key={paciente.id} className="border-t border-border/70 align-top">
                        <td className="px-4 py-4">
                          <p className="font-medium text-accent-strong">{paciente.nome}</p>
                          <p className="text-xs text-muted">ID {paciente.id}</p>
                        </td>
                        <td className="px-4 py-4">{paciente.condicao}</td>
                        <td className="px-4 py-4">
                          <p>{paciente.sexo ?? "Nao informado"}</p>
                          <p className="text-xs text-muted">
                            {paciente.faixaEtaria ?? "Sem faixa"} • {paciente.racaCor ?? "Raça n/i"}
                          </p>
                          <p className="text-xs text-muted">
                            Bolsa Familia: {paciente.bolsaFamilia === null ? "n/i" : paciente.bolsaFamilia ? "Sim" : "Nao"}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          {paciente.bairro ?? "Nao informado"}
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1 text-xs text-muted">
                            <p>Medico: {paciente.mesesUltimoAtendMedico ?? "n/i"}m</p>
                            <p>Enfermagem: {paciente.mesesUltimoAtendEnfermagem ?? "n/i"}m</p>
                            <p>Visita: {paciente.mesesUltimaVisitaDomiciliar ?? "n/i"}m</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {flags.length === 0 ? (
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                                Sem alertas
                              </span>
                            ) : (
                              flags.map((flag) => (
                                <span
                                  key={flag}
                                  className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800"
                                >
                                  {flag}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              Exibindo {dashboardData.visao.pacientes.length} de{" "}
              {dashboardData.visao.totalPacientesFiltrados} pacientes filtrados.
            </p>

            <div className="flex gap-2">
              <Link
                href={createQueryString(dashboardData.visao.filtrosAplicados, {
                  page: Math.max(1, dashboardData.visao.paginaAtual - 1),
                })}
                className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold ${
                  dashboardData.visao.paginaAtual === 1
                    ? "pointer-events-none border-border/50 text-muted/50"
                    : "border-border text-accent-strong transition hover:bg-surface-strong"
                }`}
              >
                Anterior
              </Link>
              <Link
                href={createQueryString(dashboardData.visao.filtrosAplicados, {
                  page: Math.min(
                    dashboardData.visao.totalPaginas,
                    dashboardData.visao.paginaAtual + 1,
                  ),
                })}
                className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold ${
                  dashboardData.visao.paginaAtual === dashboardData.visao.totalPaginas
                    ? "pointer-events-none border-border/50 text-muted/50"
                    : "border-border text-accent-strong transition hover:bg-surface-strong"
                }`}
              >
                Proxima
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

async function loadDashboardData(filtros: FiltrosDashboardDTO) {
  try {
    const uploadRepository = new PrismaUploadRepository();
    const pacienteRepository = new PrismaPacienteRepository();

    const [visao, uploads] = await Promise.all([
      new GerarDashboardVisaoUseCase(pacienteRepository).execute(filtros),
      new ListarUploadsUseCase(uploadRepository).execute(1),
    ]);

    return {
      visao,
      ultimoUpload: uploads[0] ?? null,
      hasDatabaseConnection: true,
    };
  } catch {
    return {
      visao: {
        resumo: EMPTY_RESUMO,
        pacientes: [],
        totalPacientesFiltrados: 0,
        totalPaginas: 1,
        paginaAtual: 1,
        topBairros: [],
        distribuicaoCondicao: [
          { label: "Diabetes", value: 0 },
          { label: "Hipertensao", value: 0 },
        ],
        coberturaCuidado: [
          {
            label: "Atendimento medico",
            covered: 0,
            uncovered: 0,
            coverageRate: 0,
          },
          {
            label: "Atendimento enfermagem",
            covered: 0,
            uncovered: 0,
            coverageRate: 0,
          },
          {
            label: "Visita domiciliar",
            covered: 0,
            uncovered: 0,
            coverageRate: 0,
          },
          {
            label: "Pressao arterial",
            covered: 0,
            uncovered: 0,
            coverageRate: 0,
          },
          {
            label: "Hemoglobina glicada",
            covered: 0,
            uncovered: 0,
            coverageRate: 0,
          },
        ],
        filterOptions: {
          bairros: [],
          sexos: [],
          racas: [],
        },
        filtrosAplicados: filtros,
      } satisfies DashboardVisaoDTO,
      ultimoUpload: null as UploadHistoricoDTO | null,
      hasDatabaseConnection: false,
    };
  }
}
