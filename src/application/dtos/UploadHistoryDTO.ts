import { type Condition } from "@/domain/value-objects/Condition";

export interface UploadHistoryDTO {
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
