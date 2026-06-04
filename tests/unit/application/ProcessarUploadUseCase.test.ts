import { describe, expect, it, vi } from "vitest";

import { ProcessUploadUseCase } from "@/application/use-cases/upload/ProcessUploadUseCase";
import { CareRecord, type CareRecordProps } from "@/domain/entities/CareRecord";
import { type Upload } from "@/domain/entities/Upload";
import { type IAggregateBucketRepository } from "@/domain/repositories/IAggregateBucketRepository";
import { type ICareEventBucketRepository } from "@/domain/repositories/ICareEventBucketRepository";
import { type IUploadRepository } from "@/domain/repositories/IUploadRepository";

function makeRecord(overrides: Partial<CareRecordProps> = {}) {
  return CareRecord.create({
    condition: "DIABETES",
    age: 61,
    sex: "F",
    raceColor: "Parda",
    familyAllowance: false,
    neighborhood: "Centro",
    monthsSinceMedicalAppointment: 8,
    monthsSinceNursingAppointment: 3,
    monthsSinceDentalAppointment: 2,
    monthsSinceHomeVisit: 2,
    monthsSinceBloodPressureCheck: 1,
    monthsSinceHbA1c: 9,
    medicalAppointmentDate: new Date("2026-05-01T00:00:00Z"),
    nursingAppointmentDate: null,
    dentalAppointmentDate: null,
    homeVisitDate: new Date("2026-05-02T00:00:00Z"),
    bloodPressureCheckDate: new Date("2026-05-03T00:00:00Z"),
    hba1cDate: new Date("2026-05-04T00:00:00Z"),
    weightInKilograms: 82,
    heightInMeters: 1.62,
    bloodPressureSystolic: 146,
    bloodPressureDiastolic: 92,
    hba1cPercentage: 7.4,
    ...overrides,
  });
}

describe("ProcessUploadUseCase", () => {
  it("processes the file and persists aggregate and event buckets", async () => {
    const records = [makeRecord(), makeRecord()];
    const fileParser = {
      parse: vi.fn().mockResolvedValue({
        condition: "DIABETES",
        records,
        capabilities: {
          supportsMedicalTimeline: true,
          supportsNursingTimeline: false,
          supportsDentalTimeline: false,
          supportsHomeVisitTimeline: true,
          supportsBmiClassification: true,
          supportsBloodPressureClassification: true,
          supportsHbA1cClassification: true,
        },
      }),
    };
    const uploadRepository: IUploadRepository = {
      save: vi.fn(async (upload: Upload) => upload),
      listRecent: vi.fn(),
      deleteAllForOwner: vi.fn(),
    };
    const aggregateBucketRepository: IAggregateBucketRepository = {
      createMany: vi.fn().mockResolvedValue(undefined),
      findByLatestUpload: vi.fn(),
    };
    const careEventBucketRepository: ICareEventBucketRepository = {
      createMany: vi.fn().mockResolvedValue(undefined),
      findByLatestUpload: vi.fn(),
    };
    const useCase = new ProcessUploadUseCase(
      fileParser,
      uploadRepository,
      aggregateBucketRepository,
      careEventBucketRepository,
    );

    const result = await useCase.execute({
      buffer: Buffer.from("dummy"),
      fileName: "diabetes-maio.csv",
      userId: "user-1",
    });

    expect(fileParser.parse).toHaveBeenCalledWith(Buffer.from("dummy"), "diabetes-maio.csv");
    expect(uploadRepository.save).toHaveBeenCalledTimes(1);
    expect(aggregateBucketRepository.createMany).toHaveBeenCalledTimes(1);
    expect(careEventBucketRepository.createMany).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      uploadId: expect.any(String),
      fileName: "diabetes-maio.csv",
      condition: "DIABETES",
      totalRecords: 2,
    });
  });
});
