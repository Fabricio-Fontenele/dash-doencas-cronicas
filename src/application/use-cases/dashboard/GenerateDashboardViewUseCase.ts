import {
  type DashboardBarChartItemDTO,
  type DashboardCoverageItemDTO,
  type DashboardFilterOptionsDTO,
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
      topNeighborhoods: this.groupAndSort(filteredBuckets, (bucket) => bucket.neighborhood ?? "Nao informado", 6),
      ageGroupDistribution: this.groupAndSort(filteredBuckets, (bucket) => bucket.ageGroup ?? "Nao informada"),
      sexDistribution: this.groupAndSort(filteredBuckets, (bucket) => bucket.sex ?? "Nao informado"),
      raceColorDistribution: this.groupAndSort(filteredBuckets, (bucket) => bucket.raceColor ?? "Nao informada"),
      careCoverage: this.buildCareCoverage(filteredBuckets),
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
      if (filters.condition !== "ALL" && bucket.condition !== filters.condition) {
        return false;
      }

      if (filters.sex && bucket.sex !== filters.sex) {
        return false;
      }

      if (filters.raceColor && bucket.raceColor !== filters.raceColor) {
        return false;
      }

      if (filters.neighborhood && bucket.neighborhood !== filters.neighborhood) {
        return false;
      }

      if (filters.familyAllowance === "YES" && bucket.familyAllowance !== true) {
        return false;
      }

      if (filters.familyAllowance === "NO" && bucket.familyAllowance !== false) {
        return false;
      }

      if (filters.ageGroup !== "ALL" && bucket.ageGroup !== filters.ageGroup) {
        return false;
      }

      if (!this.matchesCareGap(bucket, filters.careGap)) {
        return false;
      }

      return true;
    });
  }

  private matchesCareGap(bucket: AggregateBucket, careGap: CareGapFilter | null): boolean {
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
      default:
        return true;
    }
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
        label: "Hipertensao",
        value: this.sumByFlag(buckets, (bucket) => bucket.condition === "HYPERTENSION"),
      },
    ];
  }

  private buildCareCoverage(buckets: AggregateBucket[]): DashboardCoverageItemDTO[] {
    const total = this.sumCounts(buckets) || 1;

    return [
      this.createCoverageItem("Atendimento medico em dia", buckets, (bucket) => bucket.needsMedicalCare, total),
      this.createCoverageItem("Enfermagem em dia", buckets, (bucket) => bucket.needsNursingCare, total),
      this.createCoverageItem("Visita domiciliar em dia", buckets, (bucket) => bucket.needsHomeVisit, total),
      this.createCoverageItem(
        "PA recente",
        buckets,
        (bucket) => bucket.hasStaleBloodPressureMeasurement,
        total,
      ),
      this.createCoverageItem("HbA1c recente", buckets, (bucket) => bucket.hasStaleHbA1c, total),
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
}
