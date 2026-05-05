import { describe, expect, it } from "vitest";

import { Paciente } from "@/domain/entities/Paciente";
import { DomainError } from "@/domain/errors/DomainError";
import { IndicadorService } from "@/domain/services/IndicadorService";

function makePaciente(
  overrides: Partial<ConstructorParameters<typeof Paciente.create>[0]> = {},
): Paciente {
  return Paciente.create({
    id: "patient-1",
    nome: "Maria da Silva",
    condicao: "DIABETES",
    idade: 58,
    sexo: "F",
    bairro: "Centro",
    mesesUltimoAtendMedico: 8,
    mesesUltimoAtendEnfermagem: 2,
    mesesUltimaVisitaDomiciliar: 4,
    mesesUltimaMedicaoPressaoArterial: null,
    mesesUltimaHbA1c: 15,
    ...overrides,
  });
}

describe("Paciente", () => {
  it("classifica faixa etaria corretamente", () => {
    expect(makePaciente({ idade: 16 }).faixaEtaria).toBe("0-17");
    expect(makePaciente({ idade: 39 }).faixaEtaria).toBe("18-39");
    expect(makePaciente({ idade: 58 }).faixaEtaria).toBe("40-59");
    expect(makePaciente({ idade: 79 }).faixaEtaria).toBe("60-79");
    expect(makePaciente({ idade: 80 }).faixaEtaria).toBe("80+");
  });

  it("valida idade invalida", () => {
    expect(() => makePaciente({ idade: 151 })).toThrow(DomainError);
  });

  it("aplica regras clinicas por limite de meses", () => {
    const patient = makePaciente();

    expect(patient.needsMedicalCare).toBe(true);
    expect(patient.needsNursingCare).toBe(false);
    expect(patient.needsHomeVisit).toBe(true);
    expect(patient.hasStaleBloodPressureMeasurement).toBe(true);
    expect(patient.hasStaleHbA1c).toBe(true);
  });

  it("ignora HbA1c para pacientes hipertensos", () => {
    const patient = makePaciente({
      condicao: "HIPERTENSAO",
      mesesUltimaHbA1c: 30,
    });

    expect(patient.hasStaleHbA1c).toBe(false);
  });
});

describe("IndicadorService", () => {
  it("gera o resumo agregado do dashboard", () => {
    const pacientes = [
      makePaciente(),
      makePaciente({
        id: "patient-2",
        condicao: "HIPERTENSAO",
        mesesUltimoAtendMedico: 1,
        mesesUltimoAtendEnfermagem: 9,
        mesesUltimaVisitaDomiciliar: 1,
        mesesUltimaMedicaoPressaoArterial: 2,
        mesesUltimaHbA1c: null,
      }),
    ];

    expect(IndicadorService.gerarResumo(pacientes)).toEqual({
      totalPacientes: 2,
      semAtendimentoMedico: 1,
      semAtendimentoEnfermagem: 1,
      semVisitaDomiciliar: 1,
      semMedicaoPressaoRecente: 1,
      semHbA1cRecente: 1,
    });
  });
});
