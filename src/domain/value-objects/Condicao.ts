export const CONDICOES = {
  DIABETES: "DIABETES",
  HIPERTENSAO: "HIPERTENSAO",
} as const;

export type Condicao = (typeof CONDICOES)[keyof typeof CONDICOES];
