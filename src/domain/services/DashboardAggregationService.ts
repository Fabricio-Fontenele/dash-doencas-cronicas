import { AggregateBucket } from "@/domain/entities/AggregateBucket";
import { CareRecord } from "@/domain/entities/CareRecord";

export class DashboardAggregationService {
  static buildBuckets(records: CareRecord[], uploadId: string): AggregateBucket[] {
    const counts = new Map<string, { count: number; bucket: Omit<ReturnType<AggregateBucket["toJSON"]>, "uploadId" | "count"> }>();

    for (const record of records) {
      const bucketProps = {
        condition: record.condition,
        ageGroup: record.ageGroup,
        sex: record.sex,
        raceColor: record.raceColor,
        familyAllowance: record.familyAllowance,
        neighborhood: record.neighborhood,
        needsMedicalCare: record.needsMedicalCare,
        needsNursingCare: record.needsNursingCare,
        needsHomeVisit: record.needsHomeVisit,
        hasStaleBloodPressureMeasurement: record.hasStaleBloodPressureMeasurement,
        hasStaleHbA1c: record.hasStaleHbA1c,
      };
      const key = AggregateBucket.createKey(bucketProps);
      const current = counts.get(key);

      if (current) {
        current.count += 1;
        continue;
      }

      counts.set(key, {
        count: 1,
        bucket: bucketProps,
      });
    }

    return Array.from(counts.values(), ({ count, bucket }) =>
      AggregateBucket.create({
        uploadId,
        count,
        ...bucket,
      }),
    );
  }
}
