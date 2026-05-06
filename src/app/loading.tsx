export default function Loading() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f4f3f3_0%,#e2e0e0_42%,#d6e7f4_100%)]">
      <section className="mx-auto w-full max-w-[92rem] animate-pulse space-y-6 px-5 py-8 lg:px-8">
        <div className="rounded-[2rem] border border-border/70 bg-surface/95 p-8 shadow-[0_24px_80px_rgba(20,58,96,0.10)]">
          <div className="h-8 w-40 rounded-full bg-surface-strong" />
          <div className="mt-6 h-14 max-w-3xl rounded-3xl bg-surface-strong" />
          <div className="mt-4 h-5 max-w-2xl rounded-full bg-surface-strong" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <div className="rounded-[2rem] border border-border/70 bg-surface/95 p-5 shadow-[0_24px_80px_rgba(20,58,96,0.10)]">
            <div className="h-8 w-32 rounded-full bg-surface-strong" />
            <div className="mt-6 space-y-4">
              <div className="h-24 rounded-[1.5rem] bg-white/80" />
              <div className="h-24 rounded-[1.5rem] bg-white/80" />
              <div className="h-24 rounded-[1.5rem] bg-white/80" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-border/70 bg-surface/95 p-5 shadow-[0_24px_80px_rgba(20,58,96,0.10)]">
              <div className="h-8 w-52 rounded-full bg-surface-strong" />
              <div className="mt-4 h-5 max-w-xl rounded-full bg-surface-strong" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[1.75rem] border border-border/70 bg-surface p-5 shadow-[0_18px_60px_rgba(20,58,96,0.08)]"
                >
                  <div className="h-4 w-24 rounded-full bg-surface-strong" />
                  <div className="mt-5 h-10 w-20 rounded-full bg-surface-strong" />
                  <div className="mt-4 h-4 w-40 rounded-full bg-surface-strong" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
