import { type IUploadRepository } from "@/domain/repositories/IUploadRepository";

export class ClearDatasetUseCase {
  constructor(private readonly uploadRepository: IUploadRepository) {}

  async execute(ownerUserId: string): Promise<number> {
    return this.uploadRepository.deleteAllForOwner(ownerUserId);
  }
}
