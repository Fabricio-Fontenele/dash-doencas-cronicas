"use client";

import {
  DashboardDistributionSectionsInner,
  type DashboardDistributionSectionsProps,
} from "@/components/dashboard/dashboard-distribution-sections-inner";

export function DashboardDistributionSections(props: DashboardDistributionSectionsProps) {
  return <DashboardDistributionSectionsInner {...props} />;
}
