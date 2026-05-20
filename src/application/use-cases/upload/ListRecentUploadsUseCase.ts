import { type UploadHistoryDTO } from "@/application/dtos/UploadHistoryDTO";
import { type IUploadRepository } from "@/domain/repositories/IUploadRepository";

export class ListRecentUploadsUseCase {
  constructor(private readonly uploadRepository: IUploadRepository) {}

  async execute(ownerUserId: string, limit = 6): Promise<UploadHistoryDTO[]> {
    const uploads = await this.uploadRepository.listRecent(ownerUserId, limit);

    return uploads.map((upload) => ({
      id: upload.id,
      fileName: upload.fileName,
      condition: upload.condition,
      totalRecords: upload.totalRecords,
      supportsMedicalTimeline: upload.supportsMedicalTimeline,
      supportsNursingTimeline: upload.supportsNursingTimeline,
      supportsDentalTimeline: upload.supportsDentalTimeline,
      supportsHomeVisitTimeline: upload.supportsHomeVisitTimeline,
      supportsBmiClassification: upload.supportsBmiClassification,
      supportsBloodPressureClassification: upload.supportsBloodPressureClassification,
      supportsHbA1cClassification: upload.supportsHbA1cClassification,
      createdAt: upload.createdAt,
      uploadedBy: upload.uploadedBy,
    }));
  }
}
