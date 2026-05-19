import { type DashboardFiltersDTO } from "@/application/dtos/DashboardFiltersDTO";
import { type DashboardSummaryDTO } from "@/application/dtos/DashboardSummaryDTO";
import { type TimelineProfession } from "@/domain/value-objects/Profession";

export interface DashboardBarChartItemDTO {
  label: string;
  value: number;
}

export interface DashboardCoverageItemDTO {
  label: string;
  covered: number;
  uncovered: number;
  coverageRate: number;
}

export interface DashboardTimelinePointDTO {
  dateKey: string;
  label: string;
  value: number;
}

export interface DashboardProfessionalSeriesDTO {
  profession: TimelineProfession;
  label: string;
  total: number;
  points: DashboardTimelinePointDTO[];
}

export interface DashboardWarningDTO {
  id: string;
  title: string;
  description: string;
}

export interface DashboardInsightDTO {
  title: string;
  value: string;
  description: string;
  tone: "primary" | "secondary" | "highlight" | "muted";
}

export interface DashboardFilterOptionsDTO {
  neighborhoods: string[];
  sexes: string[];
  raceColors: string[];
  ibgeRaceColors: string[];
  professions: TimelineProfession[];
}

export interface DashboardViewDTO {
  summary: DashboardSummaryDTO;
  filteredRecordCount: number;
  periodLabel: string;
  conditionDistribution: DashboardBarChartItemDTO[];
  topNeighborhoods: DashboardBarChartItemDTO[];
  ageGroupDistribution: DashboardBarChartItemDTO[];
  sexDistribution: DashboardBarChartItemDTO[];
  raceColorDistribution: DashboardBarChartItemDTO[];
  ibgeRaceColorDistribution: DashboardBarChartItemDTO[];
  bmiDistribution: DashboardBarChartItemDTO[];
  bloodPressureDistribution: DashboardBarChartItemDTO[];
  hba1cDistribution: DashboardBarChartItemDTO[];
  careCoverage: DashboardCoverageItemDTO[];
  careByProfessional: DashboardProfessionalSeriesDTO[];
  homeVisitTimeline: DashboardTimelinePointDTO[];
  warnings: DashboardWarningDTO[];
  insights: DashboardInsightDTO[];
  filterOptions: DashboardFilterOptionsDTO;
  appliedFilters: DashboardFiltersDTO;
}
