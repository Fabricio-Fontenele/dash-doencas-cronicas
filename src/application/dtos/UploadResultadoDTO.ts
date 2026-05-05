import { type Condicao } from "@/domain/value-objects/Condicao";

export interface UploadResultadoDTO {
  uploadId: string;
  fileName: string;
  condicao: Condicao;
  totalRegistros: number;
}
