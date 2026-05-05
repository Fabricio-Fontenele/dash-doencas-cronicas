import { describe, expect, it, vi } from "vitest";

import { ProcessarUploadUseCase } from "@/application/use-cases/upload/ProcessarUploadUseCase";
import { Paciente } from "@/domain/entities/Paciente";
import { Upload } from "@/domain/entities/Upload";
import { type IPacienteRepository } from "@/domain/repositories/IPacienteRepository";
import { type IUploadRepository } from "@/domain/repositories/IUploadRepository";

function makePaciente(id: string): Paciente {
  return Paciente.create({
    id,
    nome: `Paciente ${id}`,
    condicao: "DIABETES",
    idade: 61,
    sexo: "F",
    bairro: "Centro",
    mesesUltimoAtendMedico: 8,
    mesesUltimoAtendEnfermagem: 3,
    mesesUltimaVisitaDomiciliar: 2,
    mesesUltimaMedicaoPressaoArterial: 1,
    mesesUltimaHbA1c: 9,
  });
}

describe("ProcessarUploadUseCase", () => {
  it("processa o arquivo e persiste upload com pacientes", async () => {
    const pacientes = [makePaciente("patient-1"), makePaciente("patient-2")];
    const fileParser = {
      parse: vi.fn().mockResolvedValue({
        condicao: "DIABETES",
        pacientes,
      }),
    };
    const uploadRepository: IUploadRepository = {
      save: vi.fn(async (upload: Upload) => upload),
    };
    const pacienteRepository: IPacienteRepository = {
      createMany: vi.fn().mockResolvedValue(undefined),
    };
    const useCase = new ProcessarUploadUseCase(
      fileParser,
      uploadRepository,
      pacienteRepository,
    );

    const result = await useCase.execute({
      buffer: Buffer.from("dummy"),
      fileName: "diabetes-maio.csv",
      userId: "user-1",
    });

    expect(fileParser.parse).toHaveBeenCalledWith(Buffer.from("dummy"), "diabetes-maio.csv");
    expect(uploadRepository.save).toHaveBeenCalledTimes(1);
    expect(pacienteRepository.createMany).toHaveBeenCalledWith(
      pacientes,
      expect.any(String),
    );
    expect(result).toEqual({
      uploadId: expect.any(String),
      fileName: "diabetes-maio.csv",
      condicao: "DIABETES",
      totalRegistros: 2,
    });
  });
});
