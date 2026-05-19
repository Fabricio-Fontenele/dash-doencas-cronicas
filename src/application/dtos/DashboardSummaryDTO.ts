export interface DashboardSummaryDTO {
  totalRecords: number;
  withoutMedicalCare: number;
  withoutNursingCare: number;
  withoutDentalCare: number;
  withoutHomeVisit: number;
  withoutRecentBloodPressureCheck: number;
  withoutRecentHbA1c: number;
  totalDiabetes: number;
  totalHypertension: number;
}
