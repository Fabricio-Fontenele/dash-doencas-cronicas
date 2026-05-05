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
          racaCor: data.racaCor,
          bolsaFamilia: data.bolsaFamilia,
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

  async findByLatestUpload(limit?: number): Promise<Paciente[]> {
    const latestUpload = await prisma.upload.findFirst({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
      },
    });

    if (!latestUpload) {
      return [];
    }

    const pacientes = await prisma.paciente.findMany({
      where: {
        uploadId: latestUpload.id,
      },
      orderBy: [
        {
          nome: "asc",
        },
      ],
      ...(typeof limit === "number" ? { take: limit } : {}),
    });

    return pacientes.map((paciente) =>
      Paciente.create({
        id: paciente.externalId,
        nome: paciente.nome,
        condicao: paciente.condicao,
        idade: paciente.idade,
        sexo: paciente.sexo,
        racaCor: paciente.racaCor,
        bolsaFamilia: paciente.bolsaFamilia,
        bairro: paciente.bairro,
        mesesUltimoAtendMedico: paciente.mesesUltimoAtendMedico,
        mesesUltimoAtendEnfermagem: paciente.mesesUltimoAtendEnfermagem,
        mesesUltimaVisitaDomiciliar: paciente.mesesUltimaVisitaDomiciliar,
        mesesUltimaMedicaoPressaoArterial: paciente.mesesUltimaMedicaoPressaoArterial,
        mesesUltimaHbA1c: paciente.mesesUltimaHbA1c,
      }),
    );
  }
}
