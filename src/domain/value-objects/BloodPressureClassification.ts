export const BLOOD_PRESSURE_CLASSIFICATIONS = [
  "CONTROLLED",
  "GRADE_1",
  "GRADE_2",
  "GRADE_3",
] as const;

export type BloodPressureClassification = (typeof BLOOD_PRESSURE_CLASSIFICATIONS)[number];

export class BloodPressureClassifier {
  static classify(
    systolic: number | null,
    diastolic: number | null,
  ): BloodPressureClassification | null {
    if (systolic === null || diastolic === null) {
      return null;
    }

    if (systolic >= 180 || diastolic >= 110) return "GRADE_3";
    if (systolic >= 160 || diastolic >= 100) return "GRADE_2";
    if (systolic >= 140 || diastolic >= 90) return "GRADE_1";

    return "CONTROLLED";
  }
}
