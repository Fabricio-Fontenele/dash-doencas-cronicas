"use client";

import dynamic from "next/dynamic";

import { type DashboardDistributionSectionsProps } from "@/components/dashboard/dashboard-distribution-sections-inner";

const DashboardDistributionSectionsInner = dynamic(
  () =>
    import("@/components/dashboard/dashboard-distribution-sections-inner").then(
      (module) => module.DashboardDistributionSectionsInner,
    ),
  {
    ssr: false,
    loading: () => (
      <>
        <section className="grid gap-4 2xl:grid-cols-[1.2fr_0.8fr]">
          <div className="h-80 rounded-[1.75rem] border border-border/70 bg-surface/70" />
          <div className="h-80 rounded-[1.75rem] border border-border/70 bg-surface/70" />
        </section>
        <section className="grid gap-4 2xl:grid-cols-[0.8fr_1.2fr]">
          <div className="h-80 rounded-[1.75rem] border border-border/70 bg-surface/70" />
          <div className="h-80 rounded-[1.75rem] border border-border/70 bg-surface/70" />
        </section>
      </>
    ),
  },
);

export function DashboardDistributionSections(props: DashboardDistributionSectionsProps) {
  return <DashboardDistributionSectionsInner {...props} />;
}
