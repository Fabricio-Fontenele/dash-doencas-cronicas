import { type Condicao } from "@/domain/value-objects/Condicao";

export interface UploadHistoricoDTO {
  id: string;
  fileName: string;
  condicao: Condicao;
  totalRegistros: number;
  createdAt: Date;
  uploadedBy: string;
}
