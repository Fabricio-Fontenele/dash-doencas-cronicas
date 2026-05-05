export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,#e6f0df_0%,#f4f1e8_45%,#ede7d9_100%)]">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-16 lg:px-10">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-border bg-surface px-4 py-1 text-sm font-medium text-accent">
            Implementacao inicial
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-accent-strong sm:text-6xl">
            Dashboard de acompanhamento para diabetes e hipertensao.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            A fundacao do projeto ja foi iniciada com Next.js, TypeScript e a primeira camada de dominio.
            As proximas entregas vao conectar upload, persistencia e indicadores reais.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-border bg-surface p-6 shadow-[0_20px_50px_rgba(49,92,66,0.08)]">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">Camada atual</p>
            <h2 className="mt-3 text-2xl font-semibold text-accent-strong">Dominio</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Entidades, value objects e regras iniciais para indicadores clinicos.
            </p>
          </article>

          <article className="rounded-3xl border border-border bg-surface p-6 shadow-[0_20px_50px_rgba(49,92,66,0.08)]">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">Proxima etapa</p>
            <h2 className="mt-3 text-2xl font-semibold text-accent-strong">Aplicacao</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Casos de uso para processamento de uploads, listagem e consolidacao de indicadores.
            </p>
          </article>

          <article className="rounded-3xl border border-border bg-surface p-6 shadow-[0_20px_50px_rgba(49,92,66,0.08)]">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">Meta funcional</p>
            <h2 className="mt-3 text-2xl font-semibold text-accent-strong">Painel utilizavel</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Importacao validada, dados persistidos e cards do dashboard alimentados pelo banco.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
