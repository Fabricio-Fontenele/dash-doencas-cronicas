export const CONDITIONS = {
  DIABETES: "DIABETES",
  HYPERTENSION: "HYPERTENSION",
} as const;

export type Condition = (typeof CONDITIONS)[keyof typeof CONDITIONS];
