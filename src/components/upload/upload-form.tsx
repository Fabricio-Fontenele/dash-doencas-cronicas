"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  initialUploadActionState,
  processUploadAction,
} from "@/presentation/actions/upload.actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Importando arquivo..." : "Importar relatorio"}
    </button>
  );
}

export function UploadForm() {
  const [state, formAction] = useActionState(
    processUploadAction,
    initialUploadActionState,
  );

  return (
    <form
      action={formAction}
      className="rounded-[2rem] border border-border bg-surface p-6 shadow-[0_24px_60px_rgba(49,92,66,0.12)]"
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
            Importacao
          </p>
          <h2 className="text-2xl font-semibold text-accent-strong">
            Carregue o relatorio exportado do prontuario
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-muted">
            O processamento acontece no servidor. Sao aceitos arquivos{" "}
            <code>.csv</code>, <code>.xls</code> e <code>.xlsx</code> de ate 10 MB.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-dashed border-border bg-[linear-gradient(135deg,rgba(219,232,211,0.6),rgba(255,253,247,0.92))] p-5">
          <label
            className="block text-sm font-medium text-accent-strong"
            htmlFor="file"
          >
            Arquivo do relatorio
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".csv,.xls,.xlsx"
            required
            className="mt-3 block w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground file:mr-4 file:rounded-full file:border-0 file:bg-surface-strong file:px-4 file:py-2 file:text-sm file:font-semibold file:text-accent-strong"
          />
          <p className="mt-3 text-xs leading-5 text-muted">
            Dica: o sistema detecta automaticamente se o relatorio e de diabetes
            ou hipertensao.
          </p>
          <div className="mt-5">
            <SubmitButton />
          </div>
        </div>
      </div>

      {state.message ? (
        <div
          className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          <p>{state.message}</p>
          {state.uploadedFileName ? (
            <p className="mt-1 text-xs opacity-80">
              Arquivo: {state.uploadedFileName}
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
