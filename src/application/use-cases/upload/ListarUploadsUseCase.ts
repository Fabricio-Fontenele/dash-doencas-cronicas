import { type UploadHistoricoDTO } from "@/application/dtos/UploadHistoricoDTO";
import { type IUploadRepository } from "@/domain/repositories/IUploadRepository";

export class ListarUploadsUseCase {
  constructor(private readonly uploadRepository: IUploadRepository) {}

  async execute(limit = 10): Promise<UploadHistoricoDTO[]> {
    return this.uploadRepository.listRecent(limit);
  }
}
