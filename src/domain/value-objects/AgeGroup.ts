export const AGE_GROUPS = [
  "0-17",
  "18-39",
  "40-59",
  "60-79",
  "80+",
] as const;

export type AgeGroup = (typeof AGE_GROUPS)[number];

export class AgeGroupCalculator {
  static fromAge(age: number | null): AgeGroup | null {
    if (age === null) {
      return null;
    }

    if (age <= 17) {
      return "0-17";
    }

    if (age <= 39) {
      return "18-39";
    }

    if (age <= 59) {
      return "40-59";
    }

    if (age <= 79) {
      return "60-79";
    }

    return "80+";
  }
}
