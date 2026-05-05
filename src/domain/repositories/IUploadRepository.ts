import { Upload } from "@/domain/entities/Upload";
import { type Condicao } from "@/domain/value-objects/Condicao";

export interface UploadHistoricoItem {
  id: string;
  fileName: string;
  condicao: Condicao;
  totalRegistros: number;
  createdAt: Date;
  uploadedBy: string;
}

export interface IUploadRepository {
  save(upload: Upload): Promise<Upload>;
  listRecent(limit: number): Promise<UploadHistoricoItem[]>;
}
