export const HBA1C_CLASSIFICATIONS = ["TARGET", "ELEVATED", "CRITICAL"] as const;

export type HbA1cClassification = (typeof HBA1C_CLASSIFICATIONS)[number];

export class HbA1cClassifier {
  static classify(value: number | null): HbA1cClassification | null {
    if (value === null) {
      return null;
    }

    if (value < 7) return "TARGET";
    if (value < 9) return "ELEVATED";

    return "CRITICAL";
  }
}
