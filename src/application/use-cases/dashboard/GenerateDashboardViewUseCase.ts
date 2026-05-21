import {
  type CareGapFilter,
  type DashboardFiltersDTO,
} from "@/application/dtos/DashboardFiltersDTO";
import { type DashboardSummaryDTO } from "@/application/dtos/DashboardSummaryDTO";
import {
  type DashboardBarChartItemDTO,
  type DashboardCoverageItemDTO,
  type DashboardFilterOptionsDTO,
  type DashboardInsightDTO,
  type DashboardProfessionalSeriesDTO,
  type DashboardTimelinePointDTO,
  type DashboardViewDTO,
  type DashboardWarningDTO,
} from "@/application/dtos/DashboardViewDTO";
import { type AggregateBucket } from "@/domain/entities/AggregateBucket";
import { type CareEventBucket } from "@/domain/entities/CareEventBucket";
import { type IAggregateBucketRepository } from "@/domain/repositories/IAggregateBucketRepository";
import { type ICareEventBucketRepository } from "@/domain/repositories/ICareEventBucketRepository";
import { TIMELINE_PROFESSIONS, type TimelineProfession } from "@/domain/value-objects/Profession";

interface DateRange {
  start: Date;
  end: Date;
  granularity: "day" | "month";
}

export class GenerateDashboardViewUseCase {
  constructor(
    private readonly aggregateBucketRepository: IAggregateBucketRepository,
    private readonly careEventBucketRepository: ICareEventBucketRepository,
  ) {}

  async execute(
    filters: DashboardFiltersDTO,
    ownerUserId: string,
  ): Promise<DashboardViewDTO> {
    const [buckets, eventBuckets] = await Promise.all([
      this.aggregateBucketRepository.findByLatestUpload(ownerUserId),
      this.careEventBucketRepository.findByLatestUpload(ownerUserId),
    ]);
    const filteredBuckets = this.applyPopulationFilters(buckets, filters);
    const filteredEventBuckets = this.applyEventFilters(eventBuckets, filters);
    const range = this.resolveDateRange(filters);

    return {
      summary: this.buildSummary(filteredBuckets),
      filteredRecordCount: this.sumCounts(filteredBuckets),
      periodLabel: this.formatRangeLabel(range, filters),
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
      sexDistribution: this.groupAndSort(filteredBuckets, (bucket) => bucket.sex ?? "Não informado"),
      raceColorDistribution: this.groupAndSort(
        filteredBuckets,
        (bucket) => bucket.raceColor ?? "Não informada",
      ),
      bmiDistribution: this.groupAndSort(
        filteredBuckets.filter((bucket) => bucket.bmiClassification !== null),
        (bucket) => this.formatBmiClassification(bucket.bmiClassification),
      ),
      bloodPressureDistribution: this.groupAndSort(
        filteredBuckets.filter((bucket) => bucket.bloodPressureClassification !== null),
        (bucket) => this.formatBloodPressureClassification(bucket.bloodPressureClassification),
      ),
      hba1cDistribution: this.groupAndSort(
        filteredBuckets.filter((bucket) => bucket.hba1cClassification !== null),
        (bucket) => this.formatHbA1cClassification(bucket.hba1cClassification),
      ),
      careCoverage: this.buildCareCoverage(filteredBuckets),
      careByProfessional: this.buildProfessionalSeries(filteredEventBuckets, range),
      homeVisitTimeline: this.buildTimeline(
        filteredEventBuckets.filter((bucket) => bucket.profession === "HOME_VISIT"),
        range,
      ),
      warnings: this.buildWarnings(filteredEventBuckets, filteredBuckets, range, filters),
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
      if (bucket.neighborhood) {neighborhoods.add(bucket.neighborhood);}
      if (bucket.sex) {sexes.add(bucket.sex);}
      if (bucket.raceColor) {raceColors.add(bucket.raceColor);}
    }

    return {
      neighborhoods: Array.from(neighborhoods).sort((left, right) => left.localeCompare(right)),
      sexes: Array.from(sexes).sort((left, right) => left.localeCompare(right)),
      raceColors: Array.from(raceColors).sort((left, right) => left.localeCompare(right)),
      professions: Array.from(TIMELINE_PROFESSIONS),
    };
  }

  private applyPopulationFilters(
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

      if (!this.matchesAgeGroupFilters(filters.ageGroups, bucket.ageGroup)) {
        return false;
      }

      if (!this.matchesCareGapFilters(bucket, filters.careGaps)) {
        return false;
      }

      return true;
    });
  }

  private applyEventFilters(
    buckets: CareEventBucket[],
    filters: DashboardFiltersDTO,
  ): CareEventBucket[] {
    return buckets.filter((bucket) => {
      if (filters.conditions.length > 0 && !filters.conditions.includes(bucket.condition)) {
        return false;
      }

      if (filters.professions.length > 0 && !filters.professions.includes(bucket.profession)) {
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

      if (!this.matchesAgeGroupFilters(filters.ageGroups, bucket.ageGroup)) {
        return false;
      }

      return true;
    });
  }

  private matchesAgeGroupFilters(
    selectedAgeGroups: DashboardFiltersDTO["ageGroups"],
    ageGroup: AggregateBucket["ageGroup"]  ,
  ): boolean {
    if (selectedAgeGroups.length === 0) {
      return true;
    }

    return ageGroup !== null && selectedAgeGroups.includes(ageGroup);
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
        case "dental":
          return bucket.needsDentalCare;
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
    if (familyAllowance === true) {return "YES";}
    if (familyAllowance === false) {return "NO";}

    return "UNKNOWN";
  }

  private buildSummary(buckets: AggregateBucket[]): DashboardSummaryDTO {
    return {
      totalRecords: this.sumCounts(buckets),
      withoutMedicalCare: this.sumByFlag(buckets, (bucket) => bucket.needsMedicalCare),
      withoutNursingCare: this.sumByFlag(buckets, (bucket) => bucket.needsNursingCare),
      withoutDentalCare: this.sumByFlag(buckets, (bucket) => bucket.needsDentalCare),
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
      this.createCoverageItem("Atendimento médico em dia", buckets, (bucket) => bucket.needsMedicalCare, total),
      this.createCoverageItem("Enfermagem em dia", buckets, (bucket) => bucket.needsNursingCare, total),
      this.createCoverageItem("Odontologia em dia", buckets, (bucket) => bucket.needsDentalCare, total),
      this.createCoverageItem("Visita domiciliar em dia", buckets, (bucket) => bucket.needsHomeVisit, total),
      this.createCoverageItem("PA recente", buckets, (bucket) => bucket.hasStaleBloodPressureMeasurement, total),
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

  private buildProfessionalSeries(
    buckets: CareEventBucket[],
    range: DateRange,
  ): DashboardProfessionalSeriesDTO[] {
    return TIMELINE_PROFESSIONS.filter((profession) => profession !== "HOME_VISIT").map(
      (profession) => {
        const filtered = buckets.filter((bucket) => bucket.profession === profession);

        return {
          profession,
          label: this.formatProfession(profession),
          total: this.sumEventCounts(filtered, range),
          points: this.buildTimeline(filtered, range),
        };
      },
    );
  }

  private buildTimeline(
    buckets: CareEventBucket[],
    range: DateRange,
  ): DashboardTimelinePointDTO[] {
    const keys = this.buildTimelineKeys(range);
    const totals = new Map<string, number>();

    for (const bucket of buckets) {
      if (!this.isWithinRange(bucket.eventDate, range)) {
        continue;
      }

      const key = range.granularity === "day"
        ? bucket.eventDate.toISOString().slice(0, 10)
        : `${bucket.eventDate.getFullYear()}-${String(bucket.eventDate.getMonth() + 1).padStart(2, "0")}`;

      totals.set(key, (totals.get(key) ?? 0) + bucket.count);
    }

    return keys.map((item) => ({
      dateKey: item.key,
      label: item.label,
      value: totals.get(item.key) ?? 0,
    }));
  }

  private buildWarnings(
    eventBuckets: CareEventBucket[],
    populationBuckets: AggregateBucket[],
    range: DateRange,
    filters: DashboardFiltersDTO,
  ): DashboardWarningDTO[] {
    const warnings: DashboardWarningDTO[] = [];

    if (populationBuckets.length === 0) {
      warnings.push({
        id: "empty-snapshot",
        title: "Recorte sem população",
        description: "Os filtros atuais eliminaram todas as pessoas do arquivo importado.",
      });
    }

    if (this.sumEventCounts(eventBuckets, range) === 0) {
      warnings.push({
        id: "empty-timeline",
        title: "Sem eventos no período selecionado",
        description: `Não há datas clínicas agregadas no período ${this.formatRangeLabel(
          range,
          filters,
        )} para o recorte atual.`,
      });
    }

    return warnings;
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
      (left, right) => left.coverageRate - right.coverageRate || right.uncovered - left.uncovered,
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
    const obesityCount = buckets.reduce(
      (sum, bucket) =>
        sum +
        (bucket.bmiClassification === "OBESITY_I" ||
        bucket.bmiClassification === "OBESITY_II" ||
        bucket.bmiClassification === "OBESITY_III"
          ? bucket.count
          : 0),
      0,
    );

    return [
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
        title: "Faixa dominante",
        value: leadingAgeGroup.label,
        description: `${leadingAgeGroup.value} pessoas estão na faixa etária mais representativa do recorte filtrado.`,
        tone: "highlight",
      },
      {
        title: "IMC em obesidade",
        value: `${Math.round((obesityCount / total) * 100)}%`,
        description: `${obesityCount} pessoas do recorte atual estão nas faixas de obesidade segundo o IMC.`,
        tone: "highlight",
      },
    ];
  }

  private getVisibleCoverageItems(buckets: AggregateBucket[]): DashboardCoverageItemDTO[] {
    const hasDiabetes = buckets.some((bucket) => bucket.condition === "DIABETES");

    return this.buildCareCoverage(buckets).filter((item) => hasDiabetes || item.label !== "HbA1c recente");
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

  private sumEventCounts(buckets: CareEventBucket[], range: DateRange): number {
    return buckets.reduce(
      (total, bucket) => total + (this.isWithinRange(bucket.eventDate, range) ? bucket.count : 0),
      0,
    );
  }

  private resolveDateRange(filters: DashboardFiltersDTO): DateRange {
    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    switch (filters.timePreset) {
      case "DAY":
        return { start: end, end, granularity: "day" };
      case "WEEK": {
        const start = new Date(end);
        start.setDate(end.getDate() - 6);
        return { start, end, granularity: "day" };
      }
      case "MONTH": {
        const start = new Date(end);
        start.setDate(end.getDate() - 29);
        return { start, end, granularity: "day" };
      }
      case "LAST_3_MONTHS":
        return {
          start: new Date(end.getFullYear(), end.getMonth() - 2, 1),
          end,
          granularity: "month",
        };
      case "LAST_6_MONTHS":
        return {
          start: new Date(end.getFullYear(), end.getMonth() - 5, 1),
          end,
          granularity: "month",
        };
      case "YEAR":
        return {
          start: new Date(end.getFullYear(), 0, 1),
          end,
          granularity: "month",
        };
      case "CUSTOM": {
        const customStart = this.parseDateFilter(filters.startDate) ?? new Date(end.getFullYear(), end.getMonth() - 5, 1);
        const customEnd = this.parseDateFilter(filters.endDate) ?? end;
        const start = customStart <= customEnd ? customStart : customEnd;
        const normalizedEnd = customStart <= customEnd ? customEnd : customStart;
        const diffInDays = Math.max(
          1,
          Math.round((normalizedEnd.getTime() - start.getTime()) / 86400000),
        );

        return {
          start,
          end: normalizedEnd,
          granularity: diffInDays <= 31 ? "day" : "month",
        };
      }
    }
  }

  private parseDateFilter(value: string | null): Date | null {
    if (!value) {
      return null;
    }

    const [year, month, day] = value.split("-").map(Number);

    if (!year || !month || !day) {
      return null;
    }

    return new Date(year, month - 1, day);
  }

  private buildTimelineKeys(range: DateRange): Array<{ key: string; label: string }> {
    const items: Array<{ key: string; label: string }> = [];

    if (range.granularity === "day") {
      for (const current = new Date(range.start); current <= range.end; current.setDate(current.getDate() + 1)) {
        const snapshot = new Date(current);
        items.push({
          key: snapshot.toISOString().slice(0, 10),
          label: new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          }).format(snapshot),
        });
      }

      return items;
    }

    for (
      const current = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
      current <= range.end;
      current.setMonth(current.getMonth() + 1)
    ) {
      const snapshot = new Date(current.getFullYear(), current.getMonth(), 1);
      items.push({
        key: `${snapshot.getFullYear()}-${String(snapshot.getMonth() + 1).padStart(2, "0")}`,
        label: `${new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(snapshot)}/${snapshot.getFullYear()}`,
      });
    }

    return items;
  }

  private isWithinRange(date: Date, range: DateRange): boolean {
    return date >= range.start && date <= new Date(range.end.getFullYear(), range.end.getMonth(), range.end.getDate(), 23, 59, 59, 999);
  }

  private formatRangeLabel(range: DateRange, filters: DashboardFiltersDTO): string {
    if (filters.timePreset === "CUSTOM") {
      return `${this.formatIsoDate(range.start)} a ${this.formatIsoDate(range.end)}`;
    }

    const presetLabels: Record<DashboardFiltersDTO["timePreset"], string> = {
      DAY: "hoje",
      WEEK: "últimos 7 dias",
      MONTH: "últimos 30 dias",
      LAST_3_MONTHS: "últimos 3 meses",
      LAST_6_MONTHS: "últimos 6 meses",
      YEAR: "ano atual",
      CUSTOM: `${range.start.toISOString().slice(0, 10)} a ${range.end.toISOString().slice(0, 10)}`,
    };

    return presetLabels[filters.timePreset];
  }

  private formatIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private formatProfession(profession: TimelineProfession): string {
    switch (profession) {
      case "MEDICAL":
        return "Médico";
      case "NURSING":
        return "Enfermagem";
      case "DENTAL":
        return "Odontologia";
      case "HOME_VISIT":
        return "Visita domiciliar";
    }
  }

  private formatBmiClassification(value: AggregateBucket["bmiClassification"]): string {
    switch (value) {
      case "UNDERWEIGHT":
        return "Baixo peso";
      case "NORMAL":
        return "Eutrofia";
      case "OVERWEIGHT":
        return "Sobrepeso";
      case "OBESITY_I":
        return "Obesidade I";
      case "OBESITY_II":
        return "Obesidade II";
      case "OBESITY_III":
        return "Obesidade III";
      case null:
        return "Não classificado";
      default:
        return "Não classificado";
    }
  }

  private formatBloodPressureClassification(value: AggregateBucket["bloodPressureClassification"]): string {
    switch (value) {
      case "CONTROLLED":
        return "PA controlada";
      case "GRADE_1":
        return "Hipertensão grau 1";
      case "GRADE_2":
        return "Hipertensão grau 2";
      case "GRADE_3":
        return "Hipertensão grau 3";
      case null:
        return "Sem classificação";
      default:
        return "Sem classificação";
    }
  }

  private formatHbA1cClassification(value: AggregateBucket["hba1cClassification"]): string {
    switch (value) {
      case "TARGET":
        return "HbA1c em alvo";
      case "ELEVATED":
        return "HbA1c elevada";
      case "CRITICAL":
        return "HbA1c muito elevada";
      case null:
        return "Sem classificação";
      default:
        return "Sem classificação";
    }
  }
}
