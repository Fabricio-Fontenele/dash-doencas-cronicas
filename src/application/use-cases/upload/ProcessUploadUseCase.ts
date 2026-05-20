import { type UploadResultDTO } from "@/application/dtos/UploadResultDTO";
import { type IFileParser } from "@/application/ports/IFileParser";
import { Upload } from "@/domain/entities/Upload";
import { type IAggregateBucketRepository } from "@/domain/repositories/IAggregateBucketRepository";
import { type ICareEventBucketRepository } from "@/domain/repositories/ICareEventBucketRepository";
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
    private readonly careEventBucketRepository: ICareEventBucketRepository,
  ) {}

  async execute(input: ProcessUploadInput): Promise<UploadResultDTO> {
    const parsedFile = await this.fileParser.parse(input.buffer, input.fileName);

    const upload = Upload.create({
      fileName: input.fileName,
      condition: parsedFile.condition,
      totalRecords: parsedFile.records.length,
      supportsMedicalTimeline: parsedFile.capabilities.supportsMedicalTimeline,
      supportsNursingTimeline: parsedFile.capabilities.supportsNursingTimeline,
      supportsDentalTimeline: parsedFile.capabilities.supportsDentalTimeline,
      supportsHomeVisitTimeline: parsedFile.capabilities.supportsHomeVisitTimeline,
      supportsBmiClassification: parsedFile.capabilities.supportsBmiClassification,
      supportsBloodPressureClassification:
        parsedFile.capabilities.supportsBloodPressureClassification,
      supportsHbA1cClassification: parsedFile.capabilities.supportsHbA1cClassification,
      userId: input.userId,
    });

    const persistedUpload = await this.uploadRepository.save(upload);
    const buckets = DashboardAggregationService.buildBuckets(parsedFile.records, persistedUpload.id);
    const careEventBuckets = DashboardAggregationService.buildCareEventBuckets(
      parsedFile.records,
      persistedUpload.id,
    );

    await this.aggregateBucketRepository.createMany(buckets, persistedUpload.id);
    await this.careEventBucketRepository.createMany(careEventBuckets, persistedUpload.id);

    return {
      uploadId: persistedUpload.id,
      fileName: input.fileName,
      condition: parsedFile.condition,
      totalRecords: parsedFile.records.length,
    };
  }
}
