export const TIME_RANGE_PRESETS = [
  "DAY",
  "WEEK",
  "MONTH",
  "LAST_3_MONTHS",
  "LAST_6_MONTHS",
  "YEAR",
  "CUSTOM",
] as const;

export type TimeRangePreset = (typeof TIME_RANGE_PRESETS)[number];
