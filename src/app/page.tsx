import { DashboardDistributionSectionsInner as DashboardDistributionSections } from "@/components/dashboard/dashboard-distribution-sections-inner";
import { DashboardFiltersPanel } from "@/components/dashboard/dashboard-filters-panel";
import {
  DashboardHero,
  DashboardSnapshotPanel,
} from "@/components/dashboard/dashboard-hero";
import {
  DashboardInsightsSection,
  DashboardSummaryGrid,
  DashboardWarningsSection,
} from "@/components/dashboard/dashboard-overview";
import {
  type DashboardSearchParams,
  parseDashboardFilters,
} from "@/presentation/dashboard/filters";
import { loadDashboardPageData } from "@/presentation/dashboard/load-dashboard-page-data";
import { buildDashboardPageViewModel } from "@/presentation/dashboard/view-model";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams?: Promise<DashboardSearchParams>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const filters = parseDashboardFilters(params);
  const pageData = await loadDashboardPageData(filters);
  const pageView = buildDashboardPageViewModel(pageData.view, pageData.latestUpload);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f4f3f3_0%,#e2e0e0_42%,#d6e7f4_100%)]">
      <section className="mx-auto w-full max-w-[92rem] px-5 py-8 lg:px-8">
        <DashboardHero pageView={pageView} />

        {!pageData.hasDatabaseConnection ? (
          <section className="mt-6 rounded-[1.75rem] border border-highlight/30 bg-highlight-soft p-5 text-sm text-[var(--status-error-text)]">
            {pageData.unavailableReason
              ? `O banco não está acessível nesta execução. ${pageData.unavailableReason}`
              : "O banco não está acessível nesta execução. O layout continua disponível, mas os dados só aparecem quando o PostgreSQL estiver pronto."}
          </section>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <aside className="space-y-6">
            <DashboardFiltersPanel view={pageData.view} />
          </aside>

          <div className="min-w-0 space-y-6">
            <DashboardSnapshotPanel
              activeFilters={pageData.view.appliedFilters}
              pageView={pageView}
            />

            <DashboardSummaryGrid items={pageView.summaryCards} />
            <DashboardInsightsSection items={pageData.view.insights} />
            <DashboardWarningsSection
              support={pageView.support}
              warnings={pageData.view.warnings}
            />

            <DashboardDistributionSections
              ageGroupDistribution={pageData.view.ageGroupDistribution}
              bmiDistribution={pageData.view.bmiDistribution}
              bloodPressureDistribution={pageData.view.bloodPressureDistribution}
              careByProfessional={pageData.view.careByProfessional}
              conditionDistribution={pageData.view.conditionDistribution}
              hba1cDistribution={pageData.view.hba1cDistribution}
              homeVisitTimeline={pageData.view.homeVisitTimeline}
              ibgeRaceColorDistribution={pageData.view.ibgeRaceColorDistribution}
              raceColorDistribution={pageData.view.raceColorDistribution}
              sexChartItems={pageView.sexChartItems}
              support={pageView.support}
              topNeighborhoods={pageData.view.topNeighborhoods}
              visibleCoverageItems={pageView.visibleCoverageItems}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
