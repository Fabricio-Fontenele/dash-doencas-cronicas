import { Paciente } from "@/domain/entities/Paciente";
import { type IPacienteRepository } from "@/domain/repositories/IPacienteRepository";
import { prisma } from "@/infrastructure/database/prisma/client";

export class PrismaPacienteRepository implements IPacienteRepository {
  async createMany(pacientes: Paciente[], uploadId: string): Promise<void> {
    if (pacientes.length === 0) {
      return;
    }

    await prisma.paciente.createMany({
      data: pacientes.map((paciente) => {
        const data = paciente.toJSON();

        return {
          externalId: data.id,
          nome: data.nome,
          condicao: data.condicao,
          idade: data.idade,
          sexo: data.sexo,
          bairro: data.bairro,
          mesesUltimoAtendMedico: data.mesesUltimoAtendMedico,
          mesesUltimoAtendEnfermagem: data.mesesUltimoAtendEnfermagem,
          mesesUltimaVisitaDomiciliar: data.mesesUltimaVisitaDomiciliar,
          mesesUltimaMedicaoPressaoArterial: data.mesesUltimaMedicaoPressaoArterial,
          mesesUltimaHbA1c: data.mesesUltimaHbA1c,
          uploadId,
        };
      }),
    });
  }
}
