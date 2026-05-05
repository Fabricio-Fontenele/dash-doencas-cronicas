import { Upload } from "@/domain/entities/Upload";
import { type Condition } from "@/domain/value-objects/Condition";

export interface UploadHistoryItem {
  id: string;
  fileName: string;
  condition: Condition;
  totalRecords: number;
  createdAt: Date;
  uploadedBy: string;
}

export interface IUploadRepository {
  save(upload: Upload): Promise<Upload>;
  listRecent(limit: number): Promise<UploadHistoryItem[]>;
}
