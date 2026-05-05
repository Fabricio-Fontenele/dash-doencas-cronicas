import { Paciente } from "@/domain/entities/Paciente";

export interface DashboardSummary {
  totalPacientes: number;
  semAtendimentoMedico: number;
  semAtendimentoEnfermagem: number;
  semVisitaDomiciliar: number;
  semMedicaoPressaoRecente: number;
  semHbA1cRecente: number;
}

export class IndicadorService {
  static gerarResumo(pacientes: Paciente[]): DashboardSummary {
    return pacientes.reduce<DashboardSummary>(
      (summary, paciente) => ({
        totalPacientes: summary.totalPacientes + 1,
        semAtendimentoMedico: summary.semAtendimentoMedico + Number(paciente.needsMedicalCare),
        semAtendimentoEnfermagem:
          summary.semAtendimentoEnfermagem + Number(paciente.needsNursingCare),
        semVisitaDomiciliar: summary.semVisitaDomiciliar + Number(paciente.needsHomeVisit),
        semMedicaoPressaoRecente:
          summary.semMedicaoPressaoRecente + Number(paciente.hasStaleBloodPressureMeasurement),
        semHbA1cRecente: summary.semHbA1cRecente + Number(paciente.hasStaleHbA1c),
      }),
      {
        totalPacientes: 0,
        semAtendimentoMedico: 0,
        semAtendimentoEnfermagem: 0,
        semVisitaDomiciliar: 0,
        semMedicaoPressaoRecente: 0,
        semHbA1cRecente: 0,
      },
    );
  }
}
