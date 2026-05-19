import { describe, expect, it } from "vitest";

import { GenerateDashboardViewUseCase } from "@/application/use-cases/dashboard/GenerateDashboardViewUseCase";
import { ListRecentUploadsUseCase } from "@/application/use-cases/upload/ListRecentUploadsUseCase";
import { AggregateBucket, type AggregateBucketProps } from "@/domain/entities/AggregateBucket";
import { CareEventBucket } from "@/domain/entities/CareEventBucket";
import { type ICareEventBucketRepository } from "@/domain/repositories/ICareEventBucketRepository";
import { type IAggregateBucketRepository } from "@/domain/repositories/IAggregateBucketRepository";
import { type IUploadRepository } from "@/domain/repositories/IUploadRepository";

function makeBucket(overrides: Partial<AggregateBucketProps> = {}): AggregateBucket {
  return AggregateBucket.create({
    uploadId: "upload-1",
    condition: "DIABETES",
    ageGroup: "60-79",
    sex: "F",
    raceColor: "Parda",
    ibgeRaceColor: "PARDA",
    familyAllowance: false,
    neighborhood: "Centro",
    needsMedicalCare: true,
    needsNursingCare: false,
    needsDentalCare: false,
    needsHomeVisit: true,
    hasStaleBloodPressureMeasurement: true,
    hasStaleHbA1c: true,
    bmiClassification: "OVERWEIGHT",
    bloodPressureClassification: null,
    hba1cClassification: "ELEVATED",
    count: 1,
    ...overrides,
  });
}

function makeAggregateBucketRepository(buckets: AggregateBucket[]): IAggregateBucketRepository {
  return {
    async createMany() {},
    async findByLatestUpload() {
      return buckets;
    },
  };
}

function makeCareEventBucketRepository(
  buckets: CareEventBucket[] = [],
): ICareEventBucketRepository {
  return {
    async createMany() {},
    async findByLatestUpload() {
      return buckets;
    },
  };
}

function makeEventBucket(overrides: Partial<ConstructorParameters<typeof CareEventBucket.create>[0]> = {}) {
  return CareEventBucket.create({
    uploadId: "upload-1",
    condition: "DIABETES",
    profession: "MEDICAL",
    eventDate: new Date("2026-05-10T00:00:00Z"),
    ageGroup: "60-79",
    sex: "F",
    raceColor: "Parda",
    ibgeRaceColor: "PARDA",
    familyAllowance: false,
    neighborhood: "Centro",
    count: 1,
    ...overrides,
  });
}

const defaultFilters = {
  conditions: [],
  sexes: [],
  raceColors: [],
  ibgeRaceColors: [],
  neighborhoods: [],
  familyAllowances: [],
  ageGroups: [],
  careGaps: [],
  professions: [],
  timePreset: "LAST_6_MONTHS" as const,
  startDate: null,
  endDate: null,
};

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
        hba1cClassification: null,
        count: 2,
      }),
    ]);

    const result = await new GenerateDashboardViewUseCase(
      repository,
      makeCareEventBucketRepository(),
    ).execute(defaultFilters);

    expect(result.summary).toEqual({
      totalRecords: 5,
      withoutMedicalCare: 3,
      withoutNursingCare: 2,
      withoutDentalCare: 0,
      withoutHomeVisit: 3,
      withoutRecentBloodPressureCheck: 3,
      withoutRecentHbA1c: 3,
      totalDiabetes: 3,
      totalHypertension: 2,
    });
    expect(result.conditionDistribution).toEqual([
      { label: "Diabetes", value: 3 },
      { label: "Hipertensão", value: 2 },
    ]);
    expect(result.filterOptions).toEqual({
      neighborhoods: ["Bela Vista", "Centro"],
      sexes: ["F", "M"],
      raceColors: ["Parda"],
      ibgeRaceColors: ["Parda"],
      professions: ["MEDICAL", "NURSING", "DENTAL", "HOME_VISIT"],
    });
  });

  it("applies union filters within the same group", async () => {
    const repository = makeAggregateBucketRepository([
      makeBucket({ count: 3, sex: "F", neighborhood: "Centro" }),
      makeBucket({ count: 2, sex: "M", neighborhood: "Bela Vista" }),
      makeBucket({ count: 1, sex: "Outro", neighborhood: "Mocambinho" }),
    ]);

    const result = await new GenerateDashboardViewUseCase(
      repository,
      makeCareEventBucketRepository(),
    ).execute({
      ...defaultFilters,
      conditions: ["DIABETES"],
      sexes: ["F", "M"],
      neighborhoods: ["Centro", "Bela Vista"],
    });

    expect(result.filteredRecordCount).toBe(5);
    expect(result.sexDistribution).toEqual([
      { label: "F", value: 3 },
      { label: "M", value: 2 },
    ]);
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
            supportsMedicalTimeline: true,
            supportsNursingTimeline: false,
            supportsDentalTimeline: false,
            supportsHomeVisitTimeline: true,
            supportsBmiClassification: true,
            supportsBloodPressureClassification: true,
            supportsHbA1cClassification: true,
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
        supportsMedicalTimeline: true,
        supportsNursingTimeline: false,
        supportsDentalTimeline: false,
        supportsHomeVisitTimeline: true,
        supportsBmiClassification: true,
        supportsBloodPressureClassification: true,
        supportsHbA1cClassification: true,
        createdAt: new Date("2026-05-05T10:00:00Z"),
        uploadedBy: "Equipe UBS",
      },
    ]);
  });

  it("emite aviso temporal quando ha eventos fora da janela, mas nenhum dentro dela", async () => {
    const repository = makeAggregateBucketRepository([makeBucket({ count: 2 })]);
    const eventsRepository = makeCareEventBucketRepository([
      makeEventBucket({ eventDate: new Date("2026-01-10T00:00:00Z") }),
    ]);

    const result = await new GenerateDashboardViewUseCase(repository, eventsRepository).execute({
      ...defaultFilters,
      timePreset: "CUSTOM",
      startDate: "2026-05-01",
      endDate: "2026-05-31",
    });

    expect(result.warnings).toContainEqual({
      id: "empty-timeline",
      title: "Sem eventos no período selecionado",
      description: "Não há datas clínicas agregadas no período 2026-05-01 a 2026-05-31 para o recorte atual.",
    });
  });

  it("normaliza intervalo customizado invertido antes de montar o rótulo do período", async () => {
    const repository = makeAggregateBucketRepository([makeBucket({ count: 1 })]);

    const result = await new GenerateDashboardViewUseCase(
      repository,
      makeCareEventBucketRepository(),
    ).execute({
      ...defaultFilters,
      timePreset: "CUSTOM",
      startDate: "2026-05-31",
      endDate: "2026-05-01",
    });

    expect(result.periodLabel).toBe("2026-05-01 a 2026-05-31");
  });
});
