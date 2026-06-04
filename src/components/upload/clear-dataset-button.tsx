"use client";

import { useEffect, useId, useState, useTransition } from "react";

import { type UploadActionState } from "@/presentation/actions/upload-action-state";
import { clearDatasetAction } from "@/presentation/actions/upload.actions";

export function ClearDatasetButton() {
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [result, setResult] = useState<UploadActionState | null>(null);
  const dialogId = useId();

  useEffect(() => {
    if (!isConfirmOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) {
        setIsConfirmOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isConfirmOpen, isPending]);

  function handleConfirm() {
    setResult(null);
    startTransition(async () => {
      const state = await clearDatasetAction();
      setResult(state);
      setIsConfirmOpen(false);
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => {
          setIsConfirmOpen(true);
        }}
        className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--status-error-border)] px-5 text-sm font-semibold text-[var(--status-error-text)] transition hover:bg-[var(--status-error-bg)]"
      >
        Limpar dataset
      </button>

      {result?.message ? (
        <div
          role="status"
          className={`rounded-2xl border px-4 py-3 text-sm ${
            result.status === "success"
              ? "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success-text)]"
              : "border-[var(--status-error-border)] bg-[var(--status-error-bg)] text-[var(--status-error-text)]"
          }`}
        >
          <p>{result.message}</p>
        </div>
      ) : null}

      {isConfirmOpen ? (
        <div>
          <button
            type="button"
            aria-label="Fechar"
            disabled={isPending}
            className="fixed inset-0 z-40 bg-[rgba(20,58,96,0.35)] backdrop-blur-[2px]"
            onClick={() => {
              setIsConfirmOpen(false);
            }}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              id={dialogId}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={`${dialogId}-title`}
              aria-describedby={`${dialogId}-description`}
              className="w-full max-w-md rounded-[1.75rem] bg-[linear-gradient(180deg,rgba(244,243,243,0.98),rgba(214,231,244,0.98))] p-6 shadow-[0_30px_80px_rgba(20,58,96,0.22)]"
            >
              <span className="inline-flex size-12 items-center justify-center rounded-full border border-[var(--status-error-border)] bg-[var(--status-error-bg)] text-[var(--status-error-text)]">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none">
                  <path
                    d="M5 7h14M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
              </span>

              <h2
                id={`${dialogId}-title`}
                className="mt-4 text-xl font-semibold text-accent-strong"
              >
                Limpar o dataset atual?
              </h2>
              <p
                id={`${dialogId}-description`}
                className="mt-2 text-sm leading-6 text-muted"
              >
                Isso remove todos os agregados importados nesta sessão e volta a dashboard ao estado inicial, como ao abrir o site pela primeira vez. Esta ação não pode ser desfeita.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setIsConfirmOpen(false);
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-accent-strong transition hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleConfirm}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--status-error-text)] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Limpando..." : "Sim, limpar dataset"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
