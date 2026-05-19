import { AggregateBucket } from "@/domain/entities/AggregateBucket";
import { CareEventBucket } from "@/domain/entities/CareEventBucket";
import { CareRecord } from "@/domain/entities/CareRecord";
import { TimelineProfession } from "@/domain/value-objects/Profession";

export class DashboardAggregationService {
  static buildBuckets(records: CareRecord[], uploadId: string): AggregateBucket[] {
    const counts = new Map<
      string,
      { count: number; bucket: Omit<ReturnType<AggregateBucket["toJSON"]>, "uploadId" | "count"> }
    >();

    for (const record of records) {
      const bucketProps = {
        condition: record.condition,
        ageGroup: record.ageGroup,
        sex: record.sex,
        raceColor: record.raceColor,
        ibgeRaceColor: record.ibgeRaceColor,
        familyAllowance: record.familyAllowance,
        neighborhood: record.neighborhood,
        needsMedicalCare: record.needsMedicalCare,
        needsNursingCare: record.needsNursingCare,
        needsDentalCare: record.needsDentalCare,
        needsHomeVisit: record.needsHomeVisit,
        hasStaleBloodPressureMeasurement: record.hasStaleBloodPressureMeasurement,
        hasStaleHbA1c: record.hasStaleHbA1c,
        bmiClassification: record.bmiClassification,
        bloodPressureClassification: record.bloodPressureClassification,
        hba1cClassification: record.hba1cClassification,
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

  static buildCareEventBuckets(records: CareRecord[], uploadId: string): CareEventBucket[] {
    const counts = new Map<
      string,
      { count: number; bucket: Omit<ReturnType<CareEventBucket["toJSON"]>, "uploadId" | "count"> }
    >();

    for (const record of records) {
      this.addCareEventBucket(counts, record, uploadId, "MEDICAL", record.medicalAppointmentDate);
      this.addCareEventBucket(counts, record, uploadId, "NURSING", record.nursingAppointmentDate);
      this.addCareEventBucket(counts, record, uploadId, "DENTAL", record.dentalAppointmentDate);
      this.addCareEventBucket(counts, record, uploadId, "HOME_VISIT", record.homeVisitDate);
    }

    return Array.from(counts.values(), ({ count, bucket }) =>
      CareEventBucket.create({
        uploadId,
        count,
        ...bucket,
      }),
    );
  }

  private static addCareEventBucket(
    counts: Map<
      string,
      { count: number; bucket: Omit<ReturnType<CareEventBucket["toJSON"]>, "uploadId" | "count"> }
    >,
    record: CareRecord,
    uploadId: string,
    profession: TimelineProfession,
    eventDate: Date | null,
  ): void {
    if (eventDate === null) {
      return;
    }

    const bucketProps = {
      condition: record.condition,
      profession,
      eventDate: this.toStartOfDay(eventDate),
      ageGroup: record.ageGroup,
      sex: record.sex,
      raceColor: record.raceColor,
      ibgeRaceColor: record.ibgeRaceColor,
      familyAllowance: record.familyAllowance,
      neighborhood: record.neighborhood,
    };
    const key = CareEventBucket.createKey(bucketProps);
    const current = counts.get(key);

    if (current) {
      current.count += 1;
      return;
    }

    counts.set(key, {
      count: 1,
      bucket: bucketProps,
    });
  }

  private static toStartOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
