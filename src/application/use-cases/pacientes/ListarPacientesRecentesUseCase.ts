import { type PacienteListaDTO } from "@/application/dtos/PacienteListaDTO";
import { type IPacienteRepository } from "@/domain/repositories/IPacienteRepository";

export class ListarPacientesRecentesUseCase {
  constructor(private readonly pacienteRepository: IPacienteRepository) {}

  async execute(limit = 8): Promise<PacienteListaDTO[]> {
    const pacientes = await this.pacienteRepository.findByLatestUpload(limit);

    return pacientes.map((paciente) => ({
      id: paciente.id,
      nome: paciente.nome,
      condicao: paciente.condicao,
      bairro: paciente.toJSON().bairro,
      faixaEtaria: paciente.faixaEtaria,
      needsMedicalCare: paciente.needsMedicalCare,
      needsNursingCare: paciente.needsNursingCare,
      needsHomeVisit: paciente.needsHomeVisit,
      hasStaleBloodPressureMeasurement: paciente.hasStaleBloodPressureMeasurement,
      hasStaleHbA1c: paciente.hasStaleHbA1c,
    }));
  }
}
