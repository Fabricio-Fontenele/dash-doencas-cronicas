import { describe, expect, it } from "vitest";

import { GenerateDashboardViewUseCase } from "@/application/use-cases/dashboard/GenerateDashboardViewUseCase";
import { ListRecentUploadsUseCase } from "@/application/use-cases/upload/ListRecentUploadsUseCase";
import { AggregateBucket, type AggregateBucketProps } from "@/domain/entities/AggregateBucket";
import { type IAggregateBucketRepository } from "@/domain/repositories/IAggregateBucketRepository";
import { type IUploadRepository } from "@/domain/repositories/IUploadRepository";

function makeBucket(
  overrides: Partial<AggregateBucketProps> = {},
): AggregateBucket {
  return AggregateBucket.create({
    uploadId: "upload-1",
    condition: "DIABETES",
    ageGroup: "60-79",
    sex: "F",
    raceColor: "Parda",
    familyAllowance: false,
    neighborhood: "Centro",
    needsMedicalCare: true,
    needsNursingCare: false,
    needsHomeVisit: true,
    hasStaleBloodPressureMeasurement: true,
    hasStaleHbA1c: true,
    count: 1,
    ...overrides,
  });
}

function makeAggregateBucketRepository(
  buckets: AggregateBucket[],
): IAggregateBucketRepository {
  return {
    async createMany() {},
    async findByLatestUpload() {
      return buckets;
    },
  };
}

describe("Dashboard application use cases", () => {
  it("builds a quantitative dashboard view from aggregate buckets", async () => {
    const repository = makeAggregateBucketRepository([
      makeBucket({ count: 3 }),
      makeBucket({
        condition: "HYPERTENSION",
        sex: "M",
        neighborhood: "Bela Vista",
        needsMedicalCare: false,
        needsNursingCare: true,
        needsHomeVisit: false,
        hasStaleBloodPressureMeasurement: false,
        hasStaleHbA1c: false,
        count: 2,
      }),
    ]);

    const result = await new GenerateDashboardViewUseCase(repository).execute({
      condition: "ALL",
      sex: null,
      raceColor: null,
      neighborhood: null,
      familyAllowance: "ALL",
      ageGroup: "ALL",
      careGap: null,
    });

    expect(result.summary).toEqual({
      totalRecords: 5,
      withoutMedicalCare: 3,
      withoutNursingCare: 2,
      withoutHomeVisit: 3,
      withoutRecentBloodPressureCheck: 3,
      withoutRecentHbA1c: 3,
      totalDiabetes: 3,
      totalHypertension: 2,
    });
    expect(result.conditionDistribution).toEqual([
      { label: "Diabetes", value: 3 },
      { label: "Hipertensao", value: 2 },
    ]);
    expect(result.filterOptions).toEqual({
      neighborhoods: ["Bela Vista", "Centro"],
      sexes: ["F", "M"],
      raceColors: ["Parda"],
    });
  });

  it("maps recent uploads to the dashboard history DTO", async () => {
    const uploadRepository: IUploadRepository = {
      async save(upload) {
        return upload;
      },
      async listRecent() {
        return [
          {
            id: "upload-1",
            fileName: "diabetes.csv",
            condition: "DIABETES",
            totalRecords: 100,
            createdAt: new Date("2026-05-05T10:00:00Z"),
            uploadedBy: "Equipe UBS",
          },
        ];
      },
    };

    const result = await new ListRecentUploadsUseCase(uploadRepository).execute(1);

    expect(result).toEqual([
      {
        id: "upload-1",
        fileName: "diabetes.csv",
        condition: "DIABETES",
        totalRecords: 100,
        createdAt: new Date("2026-05-05T10:00:00Z"),
        uploadedBy: "Equipe UBS",
      },
    ]);
  });
});
