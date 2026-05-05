import { describe, expect, it } from "vitest";

import { GerarDashboardResumoUseCase } from "@/application/use-cases/indicadores/GerarDashboardResumoUseCase";
import { ListarPacientesRecentesUseCase } from "@/application/use-cases/pacientes/ListarPacientesRecentesUseCase";
import { Paciente } from "@/domain/entities/Paciente";
import { type IPacienteRepository } from "@/domain/repositories/IPacienteRepository";

function makePaciente(
  id: string,
  overrides: Partial<ConstructorParameters<typeof Paciente.create>[0]> = {},
): Paciente {
  return Paciente.create({
    id,
    nome: `Paciente ${id}`,
    condicao: "DIABETES",
    idade: 62,
    sexo: "F",
    racaCor: "Parda",
    bolsaFamilia: false,
    bairro: "Centro",
    mesesUltimoAtendMedico: 8,
    mesesUltimoAtendEnfermagem: 2,
    mesesUltimaVisitaDomiciliar: 5,
    mesesUltimaMedicaoPressaoArterial: 7,
    mesesUltimaHbA1c: 13,
    ...overrides,
  });
}

function makeRepository(pacientes: Paciente[]): IPacienteRepository {
  return {
    async createMany() {},
    async findByLatestUpload(limit?: number) {
      return typeof limit === "number" ? pacientes.slice(0, limit) : pacientes;
    },
  };
}

describe("Dashboard use cases", () => {
  it("gera resumo agregado do ultimo upload", async () => {
    const repository = makeRepository([
      makePaciente("1"),
      makePaciente("2", {
        condicao: "HIPERTENSAO",
        mesesUltimoAtendMedico: 1,
        mesesUltimoAtendEnfermagem: 8,
        mesesUltimaVisitaDomiciliar: 1,
        mesesUltimaMedicaoPressaoArterial: 2,
        mesesUltimaHbA1c: null,
      }),
    ]);

    const result = await new GerarDashboardResumoUseCase(repository).execute();

    expect(result).toEqual({
      totalPacientes: 2,
      semAtendimentoMedico: 1,
      semAtendimentoEnfermagem: 1,
      semVisitaDomiciliar: 1,
      semMedicaoPressaoRecente: 1,
      semHbA1cRecente: 1,
      totalDiabetes: 1,
      totalHipertensao: 1,
    });
  });

  it("lista pacientes recentes ja mapeados para apresentacao", async () => {
    const repository = makeRepository([
      makePaciente("1"),
      makePaciente("2", { idade: 38, bairro: "Bela Vista" }),
    ]);

    const result = await new ListarPacientesRecentesUseCase(repository).execute(1);

    expect(result).toEqual([
      {
        id: "1",
        nome: "Paciente 1",
        condicao: "DIABETES",
        sexo: "F",
        racaCor: "Parda",
        bolsaFamilia: false,
        bairro: "Centro",
        faixaEtaria: "60-79",
        mesesUltimoAtendMedico: 8,
        mesesUltimoAtendEnfermagem: 2,
        mesesUltimaVisitaDomiciliar: 5,
        needsMedicalCare: true,
        needsNursingCare: false,
        needsHomeVisit: true,
        hasStaleBloodPressureMeasurement: true,
        hasStaleHbA1c: true,
      },
    ]);
  });
});
