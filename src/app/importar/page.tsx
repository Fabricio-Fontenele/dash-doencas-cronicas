import Link from "next/link";

import { ListRecentUploadsUseCase } from "@/application/use-cases/upload/ListRecentUploadsUseCase";
import { UploadForm } from "@/components/upload/upload-form";
import { PrismaUploadRepository } from "@/infrastructure/database/repositories/PrismaUploadRepository";

export const dynamic = "force-dynamic";

function formatUploadDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatConditionLabel(condition: "DIABETES" | "HYPERTENSION"): string {
  return condition === "DIABETES" ? "Diabetes" : "Hipertensão";
}

export default async function ImportarPage() {
  const uploads = await loadRecentUploads();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f4f3f3_0%,#e2e0e0_45%,#d6e7f4_100%)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 lg:px-10">
        <section className="space-y-4">
          <span className="inline-flex rounded-full border border-border bg-surface px-4 py-1 text-sm font-medium text-accent">
            Fluxo de upload
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-accent-strong sm:text-5xl">
            Importe os relatórios crônicos e gere um novo snapshot quantitativo.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted">
            Cada arquivo é processado no servidor para gerar contagens e distribuições anonimizadas. O sistema não persiste nomes, IDs ou qualquer dado individual de pacientes.
          </p>
        </section>

        <UploadForm />

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.75rem] border border-border bg-surface p-5">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
              Tipos aceitos
            </p>
            <p className="mt-3 text-2xl font-semibold text-accent-strong">
              CSV, XLS, XLSX
            </p>
          </article>
          <article className="rounded-[1.75rem] border border-border bg-surface p-5">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
              Detecção
            </p>
            <p className="mt-3 text-2xl font-semibold text-accent-strong">
              Diabetes ou hipertensão
            </p>
          </article>
          <article className="rounded-[1.75rem] border border-border bg-surface p-5">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
              Persistência
            </p>
            <p className="mt-3 text-2xl font-semibold text-accent-strong">
              Snapshot agregado
            </p>
          </article>
        </section>

        <section className="rounded-[2rem] border border-border bg-surface p-6 shadow-[0_24px_60px_rgba(20,58,96,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
                Histórico
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
                Últimos uploads processados
              </h2>
            </div>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-accent-strong transition hover:bg-surface-strong"
            >
              Voltar ao início
            </Link>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-border">
            <table className="w-full border-collapse">
              <thead className="bg-surface-strong text-left text-sm text-accent-strong">
                <tr>
                  <th className="px-4 py-3 font-semibold">Arquivo</th>
                  <th className="px-4 py-3 font-semibold">Condição</th>
                  <th className="px-4 py-3 font-semibold">Registros</th>
                  <th className="px-4 py-3 font-semibold">Responsável</th>
                  <th className="px-4 py-3 font-semibold">Data</th>
                </tr>
              </thead>
              <tbody className="bg-white text-sm text-foreground">
                {uploads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted">
                      Nenhum upload foi registrado ainda.
                    </td>
                  </tr>
                ) : (
                  uploads.map((upload) => (
                    <tr key={upload.id} className="border-t border-border/70">
                      <td className="px-4 py-4 font-medium">{upload.fileName}</td>
                      <td className="px-4 py-4">{formatConditionLabel(upload.condition)}</td>
                      <td className="px-4 py-4">{upload.totalRecords}</td>
                      <td className="px-4 py-4">{upload.uploadedBy}</td>
                      <td className="px-4 py-4 text-muted">
                        {formatUploadDate(upload.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

async function loadRecentUploads() {
  try {
    return await new ListRecentUploadsUseCase(new PrismaUploadRepository()).execute(6);
  } catch (error) {
    console.error("Falha ao carregar histórico de uploads:", error);
    return [];
  }
}
