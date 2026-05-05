import { AggregateBucket } from "@/domain/entities/AggregateBucket";
import { type IAggregateBucketRepository } from "@/domain/repositories/IAggregateBucketRepository";
import { type AgeGroup } from "@/domain/value-objects/AgeGroup";
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
          familyAllowance: data.familyAllowance,
          neighborhood: data.neighborhood,
          needsMedicalCare: data.needsMedicalCare,
          needsNursingCare: data.needsNursingCare,
          needsHomeVisit: data.needsHomeVisit,
          hasStaleBloodPressureMeasurement: data.hasStaleBloodPressureMeasurement,
          hasStaleHbA1c: data.hasStaleHbA1c,
          count: data.count,
          uploadId,
        };
      }),
    });
  }

  async findByLatestUpload(): Promise<AggregateBucket[]> {
    const latestUpload = await prisma.upload.findFirst({
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
        condition: bucket.condition,
        ageGroup: bucket.ageGroup as AgeGroup | null,
        sex: bucket.sex,
        raceColor: bucket.raceColor,
        familyAllowance: bucket.familyAllowance,
        neighborhood: bucket.neighborhood,
        needsMedicalCare: bucket.needsMedicalCare,
        needsNursingCare: bucket.needsNursingCare,
        needsHomeVisit: bucket.needsHomeVisit,
        hasStaleBloodPressureMeasurement: bucket.hasStaleBloodPressureMeasurement,
        hasStaleHbA1c: bucket.hasStaleHbA1c,
        count: bucket.count,
      }),
    );
  }
}
