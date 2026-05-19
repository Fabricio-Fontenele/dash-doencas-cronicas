export const PROFESSIONS = ["MEDICAL", "NURSING", "DENTAL"] as const;

export type Profession = (typeof PROFESSIONS)[number];

export const TIMELINE_PROFESSIONS = [...PROFESSIONS, "HOME_VISIT"] as const;

export type TimelineProfession = (typeof TIMELINE_PROFESSIONS)[number];
