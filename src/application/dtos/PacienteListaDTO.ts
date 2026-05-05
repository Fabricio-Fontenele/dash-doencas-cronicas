import { type Condicao } from "@/domain/value-objects/Condicao";
import { type FaixaEtaria } from "@/domain/value-objects/FaixaEtaria";

export interface PacienteListaDTO {
  id: string;
  nome: string;
  condicao: Condicao;
  bairro: string | null;
  faixaEtaria: FaixaEtaria | null;
  needsMedicalCare: boolean;
  needsNursingCare: boolean;
  needsHomeVisit: boolean;
  hasStaleBloodPressureMeasurement: boolean;
  hasStaleHbA1c: boolean;
}
