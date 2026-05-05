import { type DashboardResumoDTO } from "@/application/dtos/DashboardResumoDTO";
import { type IPacienteRepository } from "@/domain/repositories/IPacienteRepository";
import { IndicadorService } from "@/domain/services/IndicadorService";

export class GerarDashboardResumoUseCase {
  constructor(private readonly pacienteRepository: IPacienteRepository) {}

  async execute(): Promise<DashboardResumoDTO> {
    const pacientes = await this.pacienteRepository.findByLatestUpload();
    const resumo = IndicadorService.gerarResumo(pacientes);

    return {
      ...resumo,
      totalDiabetes: pacientes.filter((paciente) => paciente.condicao === "DIABETES").length,
      totalHipertensao: pacientes.filter((paciente) => paciente.condicao === "HIPERTENSAO").length,
    };
  }
}
