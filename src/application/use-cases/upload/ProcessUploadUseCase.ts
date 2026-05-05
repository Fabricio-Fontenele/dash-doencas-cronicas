import { type UploadResultDTO } from "@/application/dtos/UploadResultDTO";
import { type IFileParser } from "@/application/ports/IFileParser";
import { Upload } from "@/domain/entities/Upload";
import { type IAggregateBucketRepository } from "@/domain/repositories/IAggregateBucketRepository";
import { type IUploadRepository } from "@/domain/repositories/IUploadRepository";
import { DashboardAggregationService } from "@/domain/services/DashboardAggregationService";

export interface ProcessUploadInput {
  buffer: Buffer;
  fileName: string;
  userId: string;
}

export class ProcessUploadUseCase {
  constructor(
    private readonly fileParser: IFileParser,
    private readonly uploadRepository: IUploadRepository,
    private readonly aggregateBucketRepository: IAggregateBucketRepository,
  ) {}

  async execute(input: ProcessUploadInput): Promise<UploadResultDTO> {
    const parsedFile = await this.fileParser.parse(input.buffer, input.fileName);

    const upload = Upload.create({
      fileName: input.fileName,
      condition: parsedFile.condition,
      totalRecords: parsedFile.records.length,
      userId: input.userId,
    });

    const persistedUpload = await this.uploadRepository.save(upload);
    const buckets = DashboardAggregationService.buildBuckets(parsedFile.records, persistedUpload.id);

    await this.aggregateBucketRepository.createMany(buckets, persistedUpload.id);

    return {
      uploadId: persistedUpload.id,
      fileName: input.fileName,
      condition: parsedFile.condition,
      totalRecords: parsedFile.records.length,
    };
  }
}
