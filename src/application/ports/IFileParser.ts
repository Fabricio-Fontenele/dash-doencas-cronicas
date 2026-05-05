import { Paciente } from "@/domain/entities/Paciente";
import { type Condicao } from "@/domain/value-objects/Condicao";

export interface ParsedFileResult {
  condicao: Condicao;
  pacientes: Paciente[];
}

export interface IFileParser {
  parse(buffer: Buffer, fileName: string): Promise<ParsedFileResult>;
}
