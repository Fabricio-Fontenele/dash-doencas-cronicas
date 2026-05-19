export const BMI_CLASSIFICATIONS = [
  "UNDERWEIGHT",
  "NORMAL",
  "OVERWEIGHT",
  "OBESITY_I",
  "OBESITY_II",
  "OBESITY_III",
] as const;

export type BmiClassification = (typeof BMI_CLASSIFICATIONS)[number];

export class BmiClassifier {
  static classify(value: number | null): BmiClassification | null {
    if (value === null) {
      return null;
    }

    if (value < 18.5) return "UNDERWEIGHT";
    if (value < 25) return "NORMAL";
    if (value < 30) return "OVERWEIGHT";
    if (value < 35) return "OBESITY_I";
    if (value < 40) return "OBESITY_II";

    return "OBESITY_III";
  }
}
