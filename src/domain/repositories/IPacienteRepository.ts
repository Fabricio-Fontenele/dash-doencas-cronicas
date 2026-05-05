import { Paciente } from "@/domain/entities/Paciente";

export interface IPacienteRepository {
  createMany(pacientes: Paciente[], uploadId: string): Promise<void>;
}
