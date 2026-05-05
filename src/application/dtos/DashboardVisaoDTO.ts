import { type DashboardResumoDTO } from "@/application/dtos/DashboardResumoDTO";
import { type FiltrosDashboardDTO } from "@/application/dtos/FiltrosDashboardDTO";
import { type PacienteListaDTO } from "@/application/dtos/PacienteListaDTO";

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
  bairros: string[];
  sexos: string[];
}

export interface DashboardVisaoDTO {
  resumo: DashboardResumoDTO;
  pacientes: PacienteListaDTO[];
  totalPacientesFiltrados: number;
  totalPaginas: number;
  paginaAtual: number;
  topBairros: DashboardBarChartItemDTO[];
  distribuicaoCondicao: DashboardBarChartItemDTO[];
  coberturaCuidado: DashboardCoverageItemDTO[];
  filterOptions: DashboardFilterOptionsDTO;
  filtrosAplicados: FiltrosDashboardDTO;
}
