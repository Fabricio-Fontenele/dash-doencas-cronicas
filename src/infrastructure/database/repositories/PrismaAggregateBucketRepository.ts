import { AggregateBucket } from "@/domain/entities/AggregateBucket";
import { type IAggregateBucketRepository } from "@/domain/repositories/IAggregateBucketRepository";
import { type AgeGroup } from "@/domain/value-objects/AgeGroup";
import { type ClinicalCondition } from "@/domain/value-objects/Condition";
import { prisma } from "@/infrastructure/database/prisma/client";

export class PrismaAggregateBucketRepository implements IAggregateBucketRepository {
  async createMany(buckets: AggregateBucket[], uploadId: string): Promise<void> {
    if (buckets.length === 0) {
      return;
    }

    await prisma.aggregateBucket.createMany({
      data: buckets.map((bucket) => {
        const data = bucket.toJSON();

        return {
          condition: data.condition,
          ageGroup: data.ageGroup,
          sex: data.sex,
          raceColor: data.raceColor,
          ibgeRaceColor: data.ibgeRaceColor,
          familyAllowance: data.familyAllowance,
          neighborhood: data.neighborhood,
          needsMedicalCare: data.needsMedicalCare,
          needsNursingCare: data.needsNursingCare,
          needsDentalCare: data.needsDentalCare,
          needsHomeVisit: data.needsHomeVisit,
          hasStaleBloodPressureMeasurement: data.hasStaleBloodPressureMeasurement,
          hasStaleHbA1c: data.hasStaleHbA1c,
          bmiClassification: data.bmiClassification,
          bloodPressureClassification: data.bloodPressureClassification,
          hba1cClassification: data.hba1cClassification,
          count: data.count,
          uploadId,
        };
      }),
    });
  }

  async findByLatestUpload(ownerUserId: string): Promise<AggregateBucket[]> {
    const latestUpload = await prisma.upload.findFirst({
      where: {
        userId: ownerUserId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
      },
    });

    if (!latestUpload) {
      return [];
    }

    const buckets = await prisma.aggregateBucket.findMany({
      where: {
        uploadId: latestUpload.id,
      },
    });

    return buckets.map((bucket) =>
      AggregateBucket.create({
        uploadId: bucket.uploadId,
        condition: bucket.condition as ClinicalCondition,
        ageGroup: bucket.ageGroup as AgeGroup | null,
        sex: bucket.sex,
        raceColor: bucket.raceColor,
        ibgeRaceColor: bucket.ibgeRaceColor as AggregateBucket["ibgeRaceColor"] | null,
        familyAllowance: bucket.familyAllowance,
        neighborhood: bucket.neighborhood,
        needsMedicalCare: bucket.needsMedicalCare,
        needsNursingCare: bucket.needsNursingCare,
        needsDentalCare: bucket.needsDentalCare,
        needsHomeVisit: bucket.needsHomeVisit,
        hasStaleBloodPressureMeasurement: bucket.hasStaleBloodPressureMeasurement,
        hasStaleHbA1c: bucket.hasStaleHbA1c,
        bmiClassification: bucket.bmiClassification as AggregateBucket["bmiClassification"] | null,
        bloodPressureClassification:
          bucket.bloodPressureClassification as AggregateBucket["bloodPressureClassification"] | null,
        hba1cClassification: bucket.hba1cClassification as AggregateBucket["hba1cClassification"] | null,
        count: bucket.count,
      }),
    );
  }
}
