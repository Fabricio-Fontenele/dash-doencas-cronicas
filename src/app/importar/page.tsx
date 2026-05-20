import Link from "next/link";

import { UploadForm } from "@/components/upload/upload-form";

export const dynamic = "force-dynamic";

function formatConditionLabel(condition: "DIABETES" | "HYPERTENSION" | "MIXED"): string {
  if (condition === "DIABETES") {return "Diabetes";}
  if (condition === "HYPERTENSION") {return "Hipertensão";}

  return "Diabetes + Hipertensão";
}

export default async function ImportarPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f4f3f3_0%,#e2e0e0_45%,#d6e7f4_100%)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 lg:px-10">
        <section className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <span className="inline-flex rounded-full border border-border bg-surface px-4 py-1 text-sm font-medium text-accent">
              Fluxo de upload
            </span>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-accent-strong sm:text-5xl">
              Importe os relatórios crônicos e atualize a dashboard quantitativa.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted">
              Cada arquivo é processado no servidor para gerar contagens e distribuições anonimizadas. O sistema não persiste nomes, IDs ou qualquer dado individual de pacientes.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-accent-strong transition hover:bg-surface-strong"
          >
            Voltar ao início
          </Link>
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
              {formatConditionLabel("MIXED")}
            </p>
          </article>
          <article className="rounded-[1.75rem] border border-border bg-surface p-5">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
              Persistência
            </p>
            <p className="mt-3 text-2xl font-semibold text-accent-strong">
              Dashboard agregada
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
