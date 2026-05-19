import { describe, expect, it } from "vitest";

import { CareRecord, type CareRecordProps } from "@/domain/entities/CareRecord";
import { DomainError } from "@/domain/errors/DomainError";
import { DashboardAggregationService } from "@/domain/services/DashboardAggregationService";

function makeRecord(overrides: Partial<CareRecordProps> = {}): CareRecord {
  return CareRecord.create({
    condition: "DIABETES",
    age: 58,
    sex: "F",
    raceColor: "Parda",
    familyAllowance: false,
    neighborhood: "Centro",
    monthsSinceMedicalAppointment: 8,
    monthsSinceNursingAppointment: 2,
    monthsSinceDentalAppointment: 3,
    monthsSinceHomeVisit: 4,
    monthsSinceBloodPressureCheck: null,
    monthsSinceHbA1c: 15,
    medicalAppointmentDate: new Date("2026-05-01T00:00:00Z"),
    nursingAppointmentDate: null,
    dentalAppointmentDate: null,
    homeVisitDate: new Date("2026-05-02T00:00:00Z"),
    bloodPressureCheckDate: null,
    hba1cDate: new Date("2026-05-03T00:00:00Z"),
    weightInKilograms: 79,
    heightInMeters: 1.69,
    bloodPressureSystolic: 152,
    bloodPressureDiastolic: 94,
    hba1cPercentage: 9.1,
    ...overrides,
  });
}

describe("CareRecord", () => {
  it("classifies age groups correctly", () => {
    expect(makeRecord({ age: 16 }).ageGroup).toBe("0-17");
    expect(makeRecord({ age: 39 }).ageGroup).toBe("18-39");
    expect(makeRecord({ age: 58 }).ageGroup).toBe("40-59");
    expect(makeRecord({ age: 79 }).ageGroup).toBe("60-79");
    expect(makeRecord({ age: 80 }).ageGroup).toBe("80+");
  });

  it("validates invalid age", () => {
    expect(() => makeRecord({ age: 151 })).toThrow(DomainError);
  });

  it("applies care-gap rules using month thresholds", () => {
    const record = makeRecord();

    expect(record.needsMedicalCare).toBe(true);
    expect(record.needsNursingCare).toBe(false);
    expect(record.needsDentalCare).toBe(false);
    expect(record.needsHomeVisit).toBe(true);
    expect(record.hasStaleBloodPressureMeasurement).toBe(true);
    expect(record.hasStaleHbA1c).toBe(true);
  });

  it("classifies clinical measurements for bmi and hba1c", () => {
    const record = makeRecord();

    expect(record.bmiClassification).toBe("OVERWEIGHT");
    expect(record.hba1cClassification).toBe("CRITICAL");
  });

  it("ignores HbA1c freshness for hypertension records", () => {
    const record = makeRecord({
      condition: "HYPERTENSION",
      monthsSinceHbA1c: 30,
      hba1cPercentage: 10.2,
    });

    expect(record.hasStaleHbA1c).toBe(false);
    expect(record.hba1cClassification).toBe(null);
    expect(record.bloodPressureClassification).toBe("GRADE_1");
  });
});

describe("DashboardAggregationService", () => {
  it("groups identical records into counted buckets", () => {
    const buckets = DashboardAggregationService.buildBuckets(
      [makeRecord(), makeRecord()],
      "upload-1",
    );

    expect(buckets).toHaveLength(1);
    expect(buckets[0]?.count).toBe(2);
    expect(buckets[0]?.condition).toBe("DIABETES");
  });
});
