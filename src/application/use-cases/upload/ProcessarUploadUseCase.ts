import { type UploadResultadoDTO } from "@/application/dtos/UploadResultadoDTO";
import { type IFileParser } from "@/application/ports/IFileParser";
import { Upload } from "@/domain/entities/Upload";
import { type IPacienteRepository } from "@/domain/repositories/IPacienteRepository";
import { type IUploadRepository } from "@/domain/repositories/IUploadRepository";

export interface ProcessarUploadInput {
  buffer: Buffer;
  fileName: string;
  userId: string;
}

export class ProcessarUploadUseCase {
  constructor(
    private readonly fileParser: IFileParser,
    private readonly uploadRepository: IUploadRepository,
    private readonly pacienteRepository: IPacienteRepository,
  ) {}

  async execute(input: ProcessarUploadInput): Promise<UploadResultadoDTO> {
    const parsedFile = await this.fileParser.parse(input.buffer, input.fileName);

    const upload = Upload.create({
      fileName: input.fileName,
      condicao: parsedFile.condicao,
      totalRegistros: parsedFile.pacientes.length,
      userId: input.userId,
    });

    const persistedUpload = await this.uploadRepository.save(upload);

    await this.pacienteRepository.createMany(parsedFile.pacientes, persistedUpload.id);

    return {
      uploadId: persistedUpload.id,
      fileName: input.fileName,
      condicao: parsedFile.condicao,
      totalRegistros: parsedFile.pacientes.length,
    };
  }
}
