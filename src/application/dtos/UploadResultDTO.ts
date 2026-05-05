import { type Condition } from "@/domain/value-objects/Condition";

export interface UploadResultDTO {
  uploadId: string;
  fileName: string;
  condition: Condition;
  totalRecords: number;
}
