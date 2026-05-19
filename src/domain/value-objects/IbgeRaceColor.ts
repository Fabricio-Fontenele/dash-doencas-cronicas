export const IBGE_RACE_COLORS = [
  "BRANCA",
  "PRETA",
  "PARDA",
  "AMARELA",
  "INDIGENA",
  "NAO_INFORMADA",
] as const;

export type IbgeRaceColor = (typeof IBGE_RACE_COLORS)[number];

export class IbgeRaceColorNormalizer {
  static normalize(value: string | null): IbgeRaceColor | null {
    if (value === null) {
      return null;
    }

    const normalized = value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    if (normalized.includes("branc")) return "BRANCA";
    if (normalized.includes("pret")) return "PRETA";
    if (normalized.includes("pard")) return "PARDA";
    if (normalized.includes("amarel")) return "AMARELA";
    if (normalized.includes("indigen")) return "INDIGENA";
    if (normalized.includes("nao inform")) return "NAO_INFORMADA";

    return "NAO_INFORMADA";
  }
}
