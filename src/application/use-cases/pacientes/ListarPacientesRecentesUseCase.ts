import { type PacienteListaDTO } from "@/application/dtos/PacienteListaDTO";
import { type IPacienteRepository } from "@/domain/repositories/IPacienteRepository";

export class ListarPacientesRecentesUseCase {
  constructor(private readonly pacienteRepository: IPacienteRepository) {}

  async execute(limit = 8): Promise<PacienteListaDTO[]> {
    const pacientes = await this.pacienteRepository.findByLatestUpload(limit);

    return pacientes.map((paciente) => {
      const data = paciente.toJSON();

      return {
        id: paciente.id,
        nome: paciente.nome,
        condicao: paciente.condicao,
        sexo: data.sexo,
        racaCor: data.racaCor,
        bolsaFamilia: data.bolsaFamilia,
        bairro: data.bairro,
        faixaEtaria: paciente.faixaEtaria,
        mesesUltimoAtendMedico: data.mesesUltimoAtendMedico,
        mesesUltimoAtendEnfermagem: data.mesesUltimoAtendEnfermagem,
        mesesUltimaVisitaDomiciliar: data.mesesUltimaVisitaDomiciliar,
        needsMedicalCare: paciente.needsMedicalCare,
        needsNursingCare: paciente.needsNursingCare,
        needsHomeVisit: paciente.needsHomeVisit,
        hasStaleBloodPressureMeasurement: paciente.hasStaleBloodPressureMeasurement,
        hasStaleHbA1c: paciente.hasStaleHbA1c,
      };
    });
  }
}
