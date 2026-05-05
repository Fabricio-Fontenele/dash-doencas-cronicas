import { describe, expect, it, vi } from "vitest";

import { ProcessUploadUseCase } from "@/application/use-cases/upload/ProcessUploadUseCase";
import { CareRecord, type CareRecordProps } from "@/domain/entities/CareRecord";
import { Upload } from "@/domain/entities/Upload";
import { type IAggregateBucketRepository } from "@/domain/repositories/IAggregateBucketRepository";
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
    monthsSinceHomeVisit: 2,
    monthsSinceBloodPressureCheck: 1,
    monthsSinceHbA1c: 9,
    ...overrides,
  });
}

describe("ProcessUploadUseCase", () => {
  it("processes the file and persists only aggregate buckets", async () => {
    const records = [makeRecord(), makeRecord()];
    const fileParser = {
      parse: vi.fn().mockResolvedValue({
        condition: "DIABETES",
        records,
      }),
    };
    const uploadRepository: IUploadRepository = {
      save: vi.fn(async (upload: Upload) => upload),
      listRecent: vi.fn(),
    };
    const aggregateBucketRepository: IAggregateBucketRepository = {
      createMany: vi.fn().mockResolvedValue(undefined),
      findByLatestUpload: vi.fn(),
    };
    const useCase = new ProcessUploadUseCase(
      fileParser,
      uploadRepository,
      aggregateBucketRepository,
    );

    const result = await useCase.execute({
      buffer: Buffer.from("dummy"),
      fileName: "diabetes-maio.csv",
      userId: "user-1",
    });

    expect(fileParser.parse).toHaveBeenCalledWith(Buffer.from("dummy"), "diabetes-maio.csv");
    expect(uploadRepository.save).toHaveBeenCalledTimes(1);
    expect(aggregateBucketRepository.createMany).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      uploadId: expect.any(String),
      fileName: "diabetes-maio.csv",
      condition: "DIABETES",
      totalRecords: 2,
    });
  });
});
