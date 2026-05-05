import { type Condicao } from "@/domain/value-objects/Condicao";
import { type FaixaEtaria } from "@/domain/value-objects/FaixaEtaria";

export interface PacienteListaDTO {
  id: string;
  nome: string;
  condicao: Condicao;
  sexo: string | null;
  racaCor: string | null;
  bolsaFamilia: boolean | null;
  bairro: string | null;
  faixaEtaria: FaixaEtaria | null;
  mesesUltimoAtendMedico: number | null;
  mesesUltimoAtendEnfermagem: number | null;
  mesesUltimaVisitaDomiciliar: number | null;
  needsMedicalCare: boolean;
  needsNursingCare: boolean;
  needsHomeVisit: boolean;
  hasStaleBloodPressureMeasurement: boolean;
  hasStaleHbA1c: boolean;
}
