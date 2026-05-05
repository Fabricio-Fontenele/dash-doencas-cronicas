export interface DashboardSummaryDTO {
  totalRecords: number;
  withoutMedicalCare: number;
  withoutNursingCare: number;
  withoutHomeVisit: number;
  withoutRecentBloodPressureCheck: number;
  withoutRecentHbA1c: number;
  totalDiabetes: number;
  totalHypertension: number;
}
