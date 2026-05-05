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
  racaCor: string | null;
  bairro: string | null;
  bolsaFamilia: "TODOS" | "SIM" | "NAO";
  faixaEtaria: FaixaEtaria | "TODAS";
  busca: string;
  alerta: AlertaFiltro | null;
  minMesesMedico: number;
  minMesesEnfermagem: number;
  minMesesVisita: number;
  page: number;
  pageSize: number;
  sortBy: "name" | "condition" | "neighborhood" | "risk" | "age" | "medical-delay";
}
