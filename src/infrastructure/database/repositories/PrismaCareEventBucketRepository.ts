import { CareEventBucket } from "@/domain/entities/CareEventBucket";
import { type ICareEventBucketRepository } from "@/domain/repositories/ICareEventBucketRepository";
import { type AgeGroup } from "@/domain/value-objects/AgeGroup";
import { type ClinicalCondition } from "@/domain/value-objects/Condition";
import { type IbgeRaceColor } from "@/domain/value-objects/IbgeRaceColor";
import { type TimelineProfession } from "@/domain/value-objects/Profession";
import { prisma } from "@/infrastructure/database/prisma/client";

export class PrismaCareEventBucketRepository implements ICareEventBucketRepository {
  async createMany(buckets: CareEventBucket[], uploadId: string): Promise<void> {
    if (buckets.length === 0) {
      return;
    }

    await prisma.careEventBucket.createMany({
      data: buckets.map((bucket) => {
        const data = bucket.toJSON();

        return {
          condition: data.condition,
          profession: data.profession,
          eventDate: data.eventDate,
          ageGroup: data.ageGroup,
          sex: data.sex,
          raceColor: data.raceColor,
          ibgeRaceColor: data.ibgeRaceColor,
          familyAllowance: data.familyAllowance,
          neighborhood: data.neighborhood,
          count: data.count,
          uploadId,
        };
      }),
    });
  }

  async findByLatestUpload(): Promise<CareEventBucket[]> {
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

    const buckets = await prisma.careEventBucket.findMany({
      where: {
        uploadId: latestUpload.id,
      },
    });

    return buckets.map((bucket) =>
      CareEventBucket.create({
        uploadId: bucket.uploadId,
        condition: bucket.condition as ClinicalCondition,
        profession: bucket.profession as TimelineProfession,
        eventDate: bucket.eventDate,
        ageGroup: bucket.ageGroup as AgeGroup | null,
        sex: bucket.sex,
        raceColor: bucket.raceColor,
        ibgeRaceColor: bucket.ibgeRaceColor as IbgeRaceColor | null,
        familyAllowance: bucket.familyAllowance,
        neighborhood: bucket.neighborhood,
        count: bucket.count,
      }),
    );
  }
}
