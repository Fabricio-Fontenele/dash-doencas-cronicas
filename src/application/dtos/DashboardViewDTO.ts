import { type DashboardFiltersDTO } from "@/application/dtos/DashboardFiltersDTO";
import { type DashboardSummaryDTO } from "@/application/dtos/DashboardSummaryDTO";

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

export interface DashboardFilterOptionsDTO {
  neighborhoods: string[];
  sexes: string[];
  raceColors: string[];
}

export interface DashboardViewDTO {
  summary: DashboardSummaryDTO;
  filteredRecordCount: number;
  conditionDistribution: DashboardBarChartItemDTO[];
  topNeighborhoods: DashboardBarChartItemDTO[];
  ageGroupDistribution: DashboardBarChartItemDTO[];
  sexDistribution: DashboardBarChartItemDTO[];
  raceColorDistribution: DashboardBarChartItemDTO[];
  careCoverage: DashboardCoverageItemDTO[];
  filterOptions: DashboardFilterOptionsDTO;
  appliedFilters: DashboardFiltersDTO;
}
