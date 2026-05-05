import { type UploadHistoryDTO } from "@/application/dtos/UploadHistoryDTO";
import { type IUploadRepository } from "@/domain/repositories/IUploadRepository";

export class ListRecentUploadsUseCase {
  constructor(private readonly uploadRepository: IUploadRepository) {}

  async execute(limit = 6): Promise<UploadHistoryDTO[]> {
    const uploads = await this.uploadRepository.listRecent(limit);

    return uploads.map((upload) => ({
      id: upload.id,
      fileName: upload.fileName,
      condition: upload.condition,
      totalRecords: upload.totalRecords,
      createdAt: upload.createdAt,
      uploadedBy: upload.uploadedBy,
    }));
  }
}
