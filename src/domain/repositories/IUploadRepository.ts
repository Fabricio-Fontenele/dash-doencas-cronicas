import { type Upload } from "@/domain/entities/Upload";
import { type Condition } from "@/domain/value-objects/Condition";

export interface UploadHistoryItem {
  id: string;
  fileName: string;
  condition: Condition;
  totalRecords: number;
  supportsMedicalTimeline: boolean;
  supportsNursingTimeline: boolean;
  supportsDentalTimeline: boolean;
  supportsHomeVisitTimeline: boolean;
  supportsBmiClassification: boolean;
  supportsBloodPressureClassification: boolean;
  supportsHbA1cClassification: boolean;
  createdAt: Date;
  uploadedBy: string;
}

export interface IUploadRepository {
  save(upload: Upload): Promise<Upload>;
  listRecent(ownerUserId: string, limit: number): Promise<UploadHistoryItem[]>;
  deleteAllForOwner(ownerUserId: string): Promise<number>;
}
