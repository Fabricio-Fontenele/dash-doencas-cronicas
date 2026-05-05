import Link from "next/link";

import { type DashboardResumoDTO } from "@/application/dtos/DashboardResumoDTO";
import { type PacienteListaDTO } from "@/application/dtos/PacienteListaDTO";
import { type UploadHistoricoDTO } from "@/application/dtos/UploadHistoricoDTO";
import { GerarDashboardResumoUseCase } from "@/application/use-cases/indicadores/GerarDashboardResumoUseCase";
import { ListarPacientesRecentesUseCase } from "@/application/use-cases/pacientes/ListarPacientesRecentesUseCase";
import { ListarUploadsUseCase } from "@/application/use-cases/upload/ListarUploadsUseCase";
import { PrismaPacienteRepository } from "@/infrastructure/database/repositories/PrismaPacienteRepository";
import { PrismaUploadRepository } from "@/infrastructure/database/repositories/PrismaUploadRepository";

export const dynamic = "force-dynamic";

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

function formatUploadDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatPatientFlags(paciente: PacienteListaDTO): string[] {
  return [
    paciente.needsMedicalCare ? "Atend. medico atrasado" : null,
    paciente.needsNursingCare ? "Enfermagem atrasada" : null,
    paciente.needsHomeVisit ? "Visita domiciliar atrasada" : null,
    paciente.hasStaleBloodPressureMeasurement ? "PA sem registro recente" : null,
    paciente.hasStaleHbA1c ? "HbA1c atrasada" : null,
  ].filter((value): value is string => value !== null);
}

export default async function Home() {
  const [{ resumo, pacientes, ultimoUpload, hasDatabaseConnection }] = await Promise.all([
    loadDashboardData(),
  ]);

  const cards = [
    {
      label: "Total de pacientes",
      value: resumo.totalPacientes,
    },
    {
      label: "Sem atendimento medico > 6 meses",
      value: resumo.semAtendimentoMedico,
    },
    {
      label: "Sem enfermagem > 6 meses",
      value: resumo.semAtendimentoEnfermagem,
    },
    {
      label: "Sem visita domiciliar > 3 meses",
      value: resumo.semVisitaDomiciliar,
    },
    {
      label: "Sem medicao de PA recente",
      value: resumo.semMedicaoPressaoRecente,
    },
    {
      label: "Sem HbA1c recente",
      value: resumo.semHbA1cRecente,
    },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e6f0df_0%,#f4f1e8_45%,#ede7d9_100%)]">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 lg:px-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-border bg-surface px-4 py-1 text-sm font-medium text-accent">
              Dashboard inicial
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-accent-strong sm:text-5xl">
              Painel do ultimo upload processado.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
              Este painel ja le os dados persistidos do upload mais recente e resume os principais atrasos de acompanhamento para a equipe.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/importar"
              className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-white transition hover:bg-accent-strong"
            >
              Novo upload
            </Link>
          </div>
        </div>

        {!hasDatabaseConnection ? (
          <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            O banco nao esta acessivel nesta execucao. A interface continua compilando, mas os dados do dashboard so aparecem quando o PostgreSQL estiver disponivel.
          </section>
        ) : null}

        {ultimoUpload ? (
          <section className="rounded-[2rem] border border-border bg-surface p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
                  Ultima fotografia
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
                  {ultimoUpload.fileName}
                </h2>
              </div>
              <div className="text-sm text-muted">
                <p>Condicao: {ultimoUpload.condicao}</p>
                <p>Responsavel: {ultimoUpload.uploadedBy}</p>
                <p>Data: {formatUploadDate(ultimoUpload.createdAt)}</p>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-[2rem] border border-border bg-surface p-6">
            <h2 className="text-2xl font-semibold text-accent-strong">
              Nenhum upload processado ainda
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Assim que um relatorio for importado, os cards e a lista de pacientes passam a refletir os dados do ultimo arquivo persistido.
            </p>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.label}
              className="rounded-[1.75rem] border border-border bg-surface p-5 shadow-[0_20px_50px_rgba(49,92,66,0.08)]"
            >
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
                {card.label}
              </p>
              <p className="mt-4 text-4xl font-semibold text-accent-strong">
                {card.value}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[2rem] border border-border bg-surface p-6 shadow-[0_20px_50px_rgba(49,92,66,0.08)]">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
              Distribuicao da condicao
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] bg-surface-strong p-5">
                <p className="text-sm text-muted">Diabetes</p>
                <p className="mt-2 text-3xl font-semibold text-accent-strong">
                  {resumo.totalDiabetes}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-surface-strong p-5">
                <p className="text-sm text-muted">Hipertensao</p>
                <p className="mt-2 text-3xl font-semibold text-accent-strong">
                  {resumo.totalHipertensao}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[2rem] border border-border bg-surface p-6 shadow-[0_20px_50px_rgba(49,92,66,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
                  Proximo passo
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
                  Base pronta para filtros e tabela completa
                </h2>
              </div>
              <Link
                href="/importar"
                className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-accent-strong transition hover:bg-surface-strong"
              >
                Importar mais dados
              </Link>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">
              O projeto ja consegue importar, persistir e ler o ultimo snapshot. A proxima camada natural e adicionar filtros, lista paginada e graficos do dashboard.
            </p>
          </article>
        </section>

        <section className="rounded-[2rem] border border-border bg-surface p-6 shadow-[0_24px_60px_rgba(49,92,66,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
                Pacientes do ultimo upload
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
                Recorte inicial para acompanhamento
              </h2>
            </div>
            <span className="text-sm text-muted">
              {pacientes.length} pacientes exibidos
            </span>
          </div>

          <div className="mt-6 grid gap-4">
            {pacientes.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-border px-5 py-10 text-center text-sm text-muted">
                Sem pacientes disponiveis para exibir no dashboard.
              </div>
            ) : (
              pacientes.map((paciente) => {
                const flags = formatPatientFlags(paciente);

                return (
                  <article
                    key={paciente.id}
                    className="rounded-[1.5rem] border border-border/80 bg-white p-5"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-accent-strong">
                          {paciente.nome}
                        </h3>
                        <p className="mt-1 text-sm text-muted">
                          {paciente.condicao} • {paciente.bairro ?? "Bairro nao informado"} •{" "}
                          {paciente.faixaEtaria ?? "Faixa etaria nao informada"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {flags.length === 0 ? (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                            Sem alertas criticos no recorte atual
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
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

async function loadDashboardData() {
  try {
    const uploadRepository = new PrismaUploadRepository();
    const pacienteRepository = new PrismaPacienteRepository();

    const [resumo, pacientes, uploads] = await Promise.all([
      new GerarDashboardResumoUseCase(pacienteRepository).execute(),
      new ListarPacientesRecentesUseCase(pacienteRepository).execute(8),
      new ListarUploadsUseCase(uploadRepository).execute(1),
    ]);

    return {
      resumo,
      pacientes,
      ultimoUpload: uploads[0] ?? null,
      hasDatabaseConnection: true,
    };
  } catch {
    return {
      resumo: EMPTY_RESUMO,
      pacientes: [] as PacienteListaDTO[],
      ultimoUpload: null as UploadHistoricoDTO | null,
      hasDatabaseConnection: false,
    };
  }
}
