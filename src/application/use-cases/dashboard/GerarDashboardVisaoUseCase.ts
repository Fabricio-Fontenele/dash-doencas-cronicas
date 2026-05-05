import { type DashboardResumoDTO } from "@/application/dtos/DashboardResumoDTO";
import {
  type DashboardBarChartItemDTO,
  type DashboardCoverageItemDTO,
  type DashboardVisaoDTO,
} from "@/application/dtos/DashboardVisaoDTO";
import {
  type AlertaFiltro,
  type FiltrosDashboardDTO,
} from "@/application/dtos/FiltrosDashboardDTO";
import { type PacienteListaDTO } from "@/application/dtos/PacienteListaDTO";
import { Paciente } from "@/domain/entities/Paciente";
import { type IPacienteRepository } from "@/domain/repositories/IPacienteRepository";
import { IndicadorService } from "@/domain/services/IndicadorService";

export class GerarDashboardVisaoUseCase {
  constructor(private readonly pacienteRepository: IPacienteRepository) {}

  async execute(filtros: FiltrosDashboardDTO): Promise<DashboardVisaoDTO> {
    const pacientes = await this.pacienteRepository.findByLatestUpload();
    const filterOptions = this.buildFilterOptions(pacientes);
    const pacientesFiltrados = this.applyFilters(pacientes, filtros);
    const pacientesOrdenados = this.sortPatients(pacientesFiltrados, filtros.sortBy);
    const totalPacientesFiltrados = pacientesOrdenados.length;
    const totalPaginas = Math.max(1, Math.ceil(totalPacientesFiltrados / filtros.pageSize));
    const paginaAtual = Math.min(filtros.page, totalPaginas);
    const inicio = (paginaAtual - 1) * filtros.pageSize;
    const pagina = pacientesOrdenados.slice(inicio, inicio + filtros.pageSize);

    return {
      resumo: this.buildResumo(pacientesFiltrados),
      pacientes: pagina.map((paciente) => this.toPacienteListaDTO(paciente)),
      totalPacientesFiltrados,
      totalPaginas,
      paginaAtual,
      topBairros: this.buildTopBairros(pacientesFiltrados),
      distribuicaoCondicao: this.buildDistribuicaoCondicao(pacientesFiltrados),
      coberturaCuidado: this.buildCoberturaCuidado(pacientesFiltrados),
      filterOptions,
      filtrosAplicados: {
        ...filtros,
        page: paginaAtual,
      },
    };
  }

  private buildFilterOptions(pacientes: Paciente[]) {
    const bairros = new Set<string>();
    const sexos = new Set<string>();

    for (const paciente of pacientes) {
      const data = paciente.toJSON();

      if (data.bairro) {
        bairros.add(data.bairro);
      }

      if (data.sexo) {
        sexos.add(data.sexo);
      }
    }

    return {
      bairros: Array.from(bairros).sort((a, b) => a.localeCompare(b)),
      sexos: Array.from(sexos).sort((a, b) => a.localeCompare(b)),
    };
  }

  private applyFilters(pacientes: Paciente[], filtros: FiltrosDashboardDTO): Paciente[] {
    return pacientes.filter((paciente) => {
      const data = paciente.toJSON();
      const searchTerm = filtros.busca.trim().toLowerCase();

      if (filtros.condicao !== "TODOS" && paciente.condicao !== filtros.condicao) {
        return false;
      }

      if (filtros.sexo && data.sexo !== filtros.sexo) {
        return false;
      }

      if (filtros.bairro && data.bairro !== filtros.bairro) {
        return false;
      }

      if (
        filtros.faixaEtaria !== "TODAS" &&
        paciente.faixaEtaria !== filtros.faixaEtaria
      ) {
        return false;
      }

      if (
        searchTerm &&
        !paciente.nome.toLowerCase().includes(searchTerm) &&
        !paciente.id.toLowerCase().includes(searchTerm)
      ) {
        return false;
      }

      if (!this.matchAlertFilter(paciente, filtros.alerta)) {
        return false;
      }

      return true;
    });
  }

  private matchAlertFilter(paciente: Paciente, alerta: AlertaFiltro | null): boolean {
    switch (alerta) {
      case "medical":
        return paciente.needsMedicalCare;
      case "nursing":
        return paciente.needsNursingCare;
      case "home-visit":
        return paciente.needsHomeVisit;
      case "blood-pressure":
        return paciente.hasStaleBloodPressureMeasurement;
      case "hba1c":
        return paciente.hasStaleHbA1c;
      default:
        return true;
    }
  }

  private sortPatients(pacientes: Paciente[], sortBy: FiltrosDashboardDTO["sortBy"]): Paciente[] {
    return [...pacientes].sort((left, right) => {
      if (sortBy === "condition") {
        return left.condicao.localeCompare(right.condicao) || left.nome.localeCompare(right.nome);
      }

      if (sortBy === "neighborhood") {
        const leftNeighborhood = left.toJSON().bairro ?? "";
        const rightNeighborhood = right.toJSON().bairro ?? "";
        return leftNeighborhood.localeCompare(rightNeighborhood) || left.nome.localeCompare(right.nome);
      }

      if (sortBy === "risk") {
        return this.calculateRiskScore(right) - this.calculateRiskScore(left) || left.nome.localeCompare(right.nome);
      }

      return left.nome.localeCompare(right.nome);
    });
  }

  private calculateRiskScore(paciente: Paciente): number {
    return (
      Number(paciente.needsMedicalCare) +
      Number(paciente.needsNursingCare) +
      Number(paciente.needsHomeVisit) +
      Number(paciente.hasStaleBloodPressureMeasurement) +
      Number(paciente.hasStaleHbA1c)
    );
  }

  private buildResumo(pacientes: Paciente[]): DashboardResumoDTO {
    const resumo = IndicadorService.gerarResumo(pacientes);

    return {
      ...resumo,
      totalDiabetes: pacientes.filter((paciente) => paciente.condicao === "DIABETES").length,
      totalHipertensao: pacientes.filter((paciente) => paciente.condicao === "HIPERTENSAO").length,
    };
  }

  private buildTopBairros(pacientes: Paciente[]): DashboardBarChartItemDTO[] {
    return this.toCountChart(
      pacientes.map((paciente) => paciente.toJSON().bairro ?? "Nao informado"),
      6,
    );
  }

  private buildDistribuicaoCondicao(pacientes: Paciente[]): DashboardBarChartItemDTO[] {
    return [
      {
        label: "Diabetes",
        value: pacientes.filter((paciente) => paciente.condicao === "DIABETES").length,
      },
      {
        label: "Hipertensao",
        value: pacientes.filter((paciente) => paciente.condicao === "HIPERTENSAO").length,
      },
    ];
  }

  private buildCoberturaCuidado(pacientes: Paciente[]): DashboardCoverageItemDTO[] {
    const total = pacientes.length || 1;
    const pacientesDiabetes = pacientes.filter((paciente) => paciente.condicao === "DIABETES");
    const totalDiabetes = pacientesDiabetes.length || 1;

    return [
      {
        label: "Atendimento medico",
        covered: pacientes.filter((paciente) => !paciente.needsMedicalCare).length,
        uncovered: pacientes.filter((paciente) => paciente.needsMedicalCare).length,
        coverageRate:
          (pacientes.filter((paciente) => !paciente.needsMedicalCare).length / total) * 100,
      },
      {
        label: "Atendimento enfermagem",
        covered: pacientes.filter((paciente) => !paciente.needsNursingCare).length,
        uncovered: pacientes.filter((paciente) => paciente.needsNursingCare).length,
        coverageRate:
          (pacientes.filter((paciente) => !paciente.needsNursingCare).length / total) * 100,
      },
      {
        label: "Visita domiciliar",
        covered: pacientes.filter((paciente) => !paciente.needsHomeVisit).length,
        uncovered: pacientes.filter((paciente) => paciente.needsHomeVisit).length,
        coverageRate:
          (pacientes.filter((paciente) => !paciente.needsHomeVisit).length / total) * 100,
      },
      {
        label: "Pressao arterial",
        covered: pacientes.filter((paciente) => !paciente.hasStaleBloodPressureMeasurement).length,
        uncovered: pacientes.filter((paciente) => paciente.hasStaleBloodPressureMeasurement).length,
        coverageRate:
          (pacientes.filter((paciente) => !paciente.hasStaleBloodPressureMeasurement).length /
            total) *
          100,
      },
      {
        label: "Hemoglobina glicada",
        covered: pacientesDiabetes.filter((paciente) => !paciente.hasStaleHbA1c).length,
        uncovered: pacientesDiabetes.filter((paciente) => paciente.hasStaleHbA1c).length,
        coverageRate:
          (pacientesDiabetes.filter((paciente) => !paciente.hasStaleHbA1c).length /
            totalDiabetes) *
          100,
      },
    ];
  }

  private toCountChart(values: string[], limit: number): DashboardBarChartItemDTO[] {
    const counts = new Map<string, number>();

    for (const value of values) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, limit)
      .map(([label, value]) => ({ label, value }));
  }

  private toPacienteListaDTO(paciente: Paciente): PacienteListaDTO {
    const data = paciente.toJSON();

    return {
      id: paciente.id,
      nome: paciente.nome,
      condicao: paciente.condicao,
      bairro: data.bairro,
      faixaEtaria: paciente.faixaEtaria,
      needsMedicalCare: paciente.needsMedicalCare,
      needsNursingCare: paciente.needsNursingCare,
      needsHomeVisit: paciente.needsHomeVisit,
      hasStaleBloodPressureMeasurement: paciente.hasStaleBloodPressureMeasurement,
      hasStaleHbA1c: paciente.hasStaleHbA1c,
    };
  }
}
