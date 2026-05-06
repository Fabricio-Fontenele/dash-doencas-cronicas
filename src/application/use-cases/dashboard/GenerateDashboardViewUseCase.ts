import {
  type DashboardBarChartItemDTO,
  type DashboardCoverageItemDTO,
  type DashboardFilterOptionsDTO,
  type DashboardInsightDTO,
  type DashboardViewDTO,
} from "@/application/dtos/DashboardViewDTO";
import {
  type CareGapFilter,
  type DashboardFiltersDTO,
} from "@/application/dtos/DashboardFiltersDTO";
import { type DashboardSummaryDTO } from "@/application/dtos/DashboardSummaryDTO";
import { AggregateBucket } from "@/domain/entities/AggregateBucket";
import { type IAggregateBucketRepository } from "@/domain/repositories/IAggregateBucketRepository";

export class GenerateDashboardViewUseCase {
  constructor(private readonly aggregateBucketRepository: IAggregateBucketRepository) {}

  async execute(filters: DashboardFiltersDTO): Promise<DashboardViewDTO> {
    const buckets = await this.aggregateBucketRepository.findByLatestUpload();
    const filteredBuckets = this.applyFilters(buckets, filters);

    return {
      summary: this.buildSummary(filteredBuckets),
      filteredRecordCount: this.sumCounts(filteredBuckets),
      conditionDistribution: this.buildConditionDistribution(filteredBuckets),
      topNeighborhoods: this.groupAndSort(
        filteredBuckets,
        (bucket) => bucket.neighborhood ?? "Não informado",
        10,
      ),
      ageGroupDistribution: this.groupAndSort(
        filteredBuckets,
        (bucket) => bucket.ageGroup ?? "Não informada",
      ),
      sexDistribution: this.groupAndSort(
        filteredBuckets,
        (bucket) => bucket.sex ?? "Não informado",
      ),
      raceColorDistribution: this.groupAndSort(
        filteredBuckets,
        (bucket) => bucket.raceColor ?? "Não informada",
      ),
      careCoverage: this.buildCareCoverage(filteredBuckets),
      insights: this.buildInsights(filteredBuckets),
      filterOptions: this.buildFilterOptions(buckets),
      appliedFilters: filters,
    };
  }

  private buildFilterOptions(buckets: AggregateBucket[]): DashboardFilterOptionsDTO {
    const neighborhoods = new Set<string>();
    const sexes = new Set<string>();
    const raceColors = new Set<string>();

    for (const bucket of buckets) {
      if (bucket.neighborhood) neighborhoods.add(bucket.neighborhood);
      if (bucket.sex) sexes.add(bucket.sex);
      if (bucket.raceColor) raceColors.add(bucket.raceColor);
    }

    return {
      neighborhoods: Array.from(neighborhoods).sort((left, right) => left.localeCompare(right)),
      sexes: Array.from(sexes).sort((left, right) => left.localeCompare(right)),
      raceColors: Array.from(raceColors).sort((left, right) => left.localeCompare(right)),
    };
  }

  private applyFilters(
    buckets: AggregateBucket[],
    filters: DashboardFiltersDTO,
  ): AggregateBucket[] {
    return buckets.filter((bucket) => {
      if (filters.conditions.length > 0 && !filters.conditions.includes(bucket.condition)) {
        return false;
      }

      if (filters.sexes.length > 0 && !filters.sexes.includes(bucket.sex ?? "")) {
        return false;
      }

      if (filters.raceColors.length > 0 && !filters.raceColors.includes(bucket.raceColor ?? "")) {
        return false;
      }

      if (
        filters.neighborhoods.length > 0 &&
        !filters.neighborhoods.includes(bucket.neighborhood ?? "")
      ) {
        return false;
      }

      if (
        filters.familyAllowances.length > 0 &&
        !filters.familyAllowances.includes(this.getFamilyAllowanceFilterValue(bucket.familyAllowance))
      ) {
        return false;
      }

      if (filters.ageGroups.length > 0 && !filters.ageGroups.includes(bucket.ageGroup!)) {
        return false;
      }

      if (!this.matchesCareGapFilters(bucket, filters.careGaps)) {
        return false;
      }

      return true;
    });
  }

  private matchesCareGapFilters(bucket: AggregateBucket, careGaps: CareGapFilter[]): boolean {
    if (careGaps.length === 0) {
      return true;
    }

    return careGaps.some((careGap) => {
      switch (careGap) {
        case "medical":
          return bucket.needsMedicalCare;
        case "nursing":
          return bucket.needsNursingCare;
        case "home-visit":
          return bucket.needsHomeVisit;
        case "blood-pressure":
          return bucket.hasStaleBloodPressureMeasurement;
        case "hba1c":
          return bucket.hasStaleHbA1c;
      }
    });
  }

  private getFamilyAllowanceFilterValue(
    familyAllowance: boolean | null,
  ): "YES" | "NO" | "UNKNOWN" {
    if (familyAllowance === true) {
      return "YES";
    }

    if (familyAllowance === false) {
      return "NO";
    }

    return "UNKNOWN";
  }

  private buildSummary(buckets: AggregateBucket[]): DashboardSummaryDTO {
    return {
      totalRecords: this.sumCounts(buckets),
      withoutMedicalCare: this.sumByFlag(buckets, (bucket) => bucket.needsMedicalCare),
      withoutNursingCare: this.sumByFlag(buckets, (bucket) => bucket.needsNursingCare),
      withoutHomeVisit: this.sumByFlag(buckets, (bucket) => bucket.needsHomeVisit),
      withoutRecentBloodPressureCheck: this.sumByFlag(
        buckets,
        (bucket) => bucket.hasStaleBloodPressureMeasurement,
      ),
      withoutRecentHbA1c: this.sumByFlag(buckets, (bucket) => bucket.hasStaleHbA1c),
      totalDiabetes: this.sumByFlag(buckets, (bucket) => bucket.condition === "DIABETES"),
      totalHypertension: this.sumByFlag(buckets, (bucket) => bucket.condition === "HYPERTENSION"),
    };
  }

  private buildConditionDistribution(buckets: AggregateBucket[]): DashboardBarChartItemDTO[] {
    return [
      {
        label: "Diabetes",
        value: this.sumByFlag(buckets, (bucket) => bucket.condition === "DIABETES"),
      },
      {
        label: "Hipertensão",
        value: this.sumByFlag(buckets, (bucket) => bucket.condition === "HYPERTENSION"),
      },
    ];
  }

  private buildCareCoverage(buckets: AggregateBucket[]): DashboardCoverageItemDTO[] {
    const total = this.sumCounts(buckets) || 1;

    return [
      this.createCoverageItem(
        "Atendimento médico em dia",
        buckets,
        (bucket) => bucket.needsMedicalCare,
        total,
      ),
      this.createCoverageItem(
        "Enfermagem em dia",
        buckets,
        (bucket) => bucket.needsNursingCare,
        total,
      ),
      this.createCoverageItem(
        "Visita domiciliar em dia",
        buckets,
        (bucket) => bucket.needsHomeVisit,
        total,
      ),
      this.createCoverageItem(
        "PA recente",
        buckets,
        (bucket) => bucket.hasStaleBloodPressureMeasurement,
        total,
      ),
      this.createCoverageItem("HbA1c recente", buckets, (bucket) => bucket.hasStaleHbA1c, total),
    ];
  }

  private buildInsights(buckets: AggregateBucket[]): DashboardInsightDTO[] {
    const total = this.sumCounts(buckets);

    if (total === 0) {
      return [];
    }

    const visibleCoverage = this.getVisibleCoverageItems(buckets);
    const averageCoverage = Math.round(
      visibleCoverage.reduce((sum, item) => sum + item.coverageRate, 0) / visibleCoverage.length,
    );
    const worstCoverage = [...visibleCoverage].sort(
      (left, right) =>
        left.coverageRate - right.coverageRate || right.uncovered - left.uncovered,
    )[0];
    const topNeighborhood = this.groupAndSort(
      buckets,
      (bucket) => bucket.neighborhood ?? "Não informado",
      1,
    )[0];
    const leadingAgeGroup = this.groupAndSort(
      buckets,
      (bucket) => bucket.ageGroup ?? "Não informada",
      1,
    )[0];
    const multiGapCount = buckets.reduce(
      (sum, bucket) =>
        sum + (this.countActiveCareGaps(bucket) >= 2 ? bucket.count : 0),
      0,
    );

    return [
      {
        title: "Pressão assistencial",
        value: `${Math.round((multiGapCount / total) * 100)}%`,
        description: `${multiGapCount} pessoas concentram duas ou mais pendências de cuidado no recorte atual.`,
        tone: "highlight",
      },
      {
        title: "Cobertura média",
        value: `${averageCoverage}%`,
        description: `Média consolidada dos indicadores de acompanhamento em ${visibleCoverage.length} frentes de cuidado.`,
        tone: "primary",
      },
      {
        title: "Pior gargalo",
        value: worstCoverage.label,
        description: `${worstCoverage.uncovered} pessoas estão em atraso no indicador com menor cobertura (${worstCoverage.coverageRate}%).`,
        tone: "secondary",
      },
      {
        title: "Concentração territorial",
        value: `${Math.round((topNeighborhood.value / total) * 100)}%`,
        description: `${topNeighborhood.label} concentra ${topNeighborhood.value} pessoas, a maior carga territorial do recorte.`,
        tone: "muted",
      },
      {
        title: "Perfil dominante",
        value: leadingAgeGroup.label,
        description: `${leadingAgeGroup.value} pessoas estão na faixa etária mais representativa do snapshot filtrado.`,
        tone: "primary",
      },
    ];
  }

  private createCoverageItem(
    label: string,
    buckets: AggregateBucket[],
    predicate: (bucket: AggregateBucket) => boolean,
    total: number,
  ): DashboardCoverageItemDTO {
    const uncovered = this.sumByFlag(buckets, predicate);
    const covered = this.sumCounts(buckets) - uncovered;

    return {
      label,
      covered,
      uncovered,
      coverageRate: Math.round((covered / total) * 100),
    };
  }

  private getVisibleCoverageItems(buckets: AggregateBucket[]): DashboardCoverageItemDTO[] {
    const hasDiabetes = buckets.some((bucket) => bucket.condition === "DIABETES");
    return this.buildCareCoverage(buckets).filter(
      (item) => hasDiabetes || item.label !== "HbA1c recente",
    );
  }

  private groupAndSort(
    buckets: AggregateBucket[],
    getLabel: (bucket: AggregateBucket) => string,
    limit?: number,
  ): DashboardBarChartItemDTO[] {
    const totals = new Map<string, number>();

    for (const bucket of buckets) {
      const label = getLabel(bucket);
      totals.set(label, (totals.get(label) ?? 0) + bucket.count);
    }

    const sorted = Array.from(totals.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));

    return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
  }

  private sumCounts(buckets: AggregateBucket[]): number {
    return buckets.reduce((total, bucket) => total + bucket.count, 0);
  }

  private sumByFlag(
    buckets: AggregateBucket[],
    predicate: (bucket: AggregateBucket) => boolean,
  ): number {
    return buckets.reduce((total, bucket) => total + (predicate(bucket) ? bucket.count : 0), 0);
  }

  private countActiveCareGaps(bucket: AggregateBucket): number {
    return [
      bucket.needsMedicalCare,
      bucket.needsNursingCare,
      bucket.needsHomeVisit,
      bucket.hasStaleBloodPressureMeasurement,
      bucket.hasStaleHbA1c,
    ].filter(Boolean).length;
  }
}
