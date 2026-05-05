import { type Condicao } from "@/domain/value-objects/Condicao";
import { type FaixaEtaria } from "@/domain/value-objects/FaixaEtaria";

export type AlertaFiltro =
  | "medical"
  | "nursing"
  | "home-visit"
  | "blood-pressure"
  | "hba1c";

export interface FiltrosDashboardDTO {
  condicao: Condicao | "TODOS";
  sexo: string | null;
  bairro: string | null;
  faixaEtaria: FaixaEtaria | "TODAS";
  busca: string;
  alerta: AlertaFiltro | null;
  page: number;
  pageSize: number;
  sortBy: "name" | "condition" | "neighborhood" | "risk";
}
