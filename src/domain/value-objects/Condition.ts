export const CONDITIONS = {
  DIABETES: "DIABETES",
  HYPERTENSION: "HYPERTENSION",
  MIXED: "MIXED",
} as const;

export type Condition = (typeof CONDITIONS)[keyof typeof CONDITIONS];

export type ClinicalCondition = Exclude<Condition, "MIXED">;
