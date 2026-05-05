export const FAIXAS_ETARIAS = [
  "0-17",
  "18-39",
  "40-59",
  "60-79",
  "80+",
] as const;

export type FaixaEtaria = (typeof FAIXAS_ETARIAS)[number];

export class FaixaEtariaCalculator {
  static fromAge(age: number | null): FaixaEtaria | null {
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
