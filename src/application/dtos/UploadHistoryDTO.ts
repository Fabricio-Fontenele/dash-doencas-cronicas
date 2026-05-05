import { type Condition } from "@/domain/value-objects/Condition";

export interface UploadHistoryDTO {
  id: string;
  fileName: string;
  condition: Condition;
  totalRecords: number;
  createdAt: Date;
  uploadedBy: string;
}
