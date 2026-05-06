import { type DashboardSummaryDTO } from "@/application/dtos/DashboardSummaryDTO";
import { type DashboardViewDTO } from "@/application/dtos/DashboardViewDTO";
import { type UploadHistoryDTO } from "@/application/dtos/UploadHistoryDTO";
import { type DashboardFiltersDTO } from "@/application/dtos/DashboardFiltersDTO";
import { GenerateDashboardViewUseCase } from "@/application/use-cases/dashboard/GenerateDashboardViewUseCase";
import { ListRecentUploadsUseCase } from "@/application/use-cases/upload/ListRecentUploadsUseCase";
import { PrismaAggregateBucketRepository } from "@/infrastructure/database/repositories/PrismaAggregateBucketRepository";
import { PrismaUploadRepository } from "@/infrastructure/database/repositories/PrismaUploadRepository";

const EMPTY_SUMMARY: DashboardSummaryDTO = {
  totalRecords: 0,
  withoutMedicalCare: 0,
  withoutNursingCare: 0,
  withoutHomeVisit: 0,
  withoutRecentBloodPressureCheck: 0,
  withoutRecentHbA1c: 0,
  totalDiabetes: 0,
  totalHypertension: 0,
};

export interface DashboardPageData {
  view: DashboardViewDTO;
  latestUpload: UploadHistoryDTO | null;
  hasDatabaseConnection: boolean;
  unavailableReason: string | null;
}

export async function loadDashboardPageData(
  filters: DashboardFiltersDTO,
): Promise<DashboardPageData> {
  try {
    const uploadRepository = new PrismaUploadRepository();
    const aggregateBucketRepository = new PrismaAggregateBucketRepository();

    const [view, uploads] = await Promise.all([
      new GenerateDashboardViewUseCase(aggregateBucketRepository).execute(filters),
      new ListRecentUploadsUseCase(uploadRepository).execute(1),
    ]);

    return {
      view,
      latestUpload: uploads[0] ?? null,
      hasDatabaseConnection: true,
      unavailableReason: null,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Falha inesperada ao carregar o snapshot agregado.";

    console.error("Falha ao carregar dados da dashboard:", error);

    return {
      view: createEmptyDashboardView(filters),
      latestUpload: null,
      hasDatabaseConnection: false,
      unavailableReason: message,
    };
  }
}

function createEmptyDashboardView(filters: DashboardFiltersDTO): DashboardViewDTO {
  return {
    summary: EMPTY_SUMMARY,
    filteredRecordCount: 0,
    conditionDistribution: [
      { label: "Diabetes", value: 0 },
      { label: "Hipertensão", value: 0 },
    ],
    topNeighborhoods: [],
    ageGroupDistribution: [],
    sexDistribution: [],
    raceColorDistribution: [],
    careCoverage: [
      { label: "Atendimento médico em dia", covered: 0, uncovered: 0, coverageRate: 0 },
      { label: "Enfermagem em dia", covered: 0, uncovered: 0, coverageRate: 0 },
      { label: "Visita domiciliar em dia", covered: 0, uncovered: 0, coverageRate: 0 },
      { label: "PA recente", covered: 0, uncovered: 0, coverageRate: 0 },
      { label: "HbA1c recente", covered: 0, uncovered: 0, coverageRate: 0 },
    ],
    insights: [],
    filterOptions: {
      neighborhoods: [],
      sexes: [],
      raceColors: [],
    },
    appliedFilters: filters,
  };
}
