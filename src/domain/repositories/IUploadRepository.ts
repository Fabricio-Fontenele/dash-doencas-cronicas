import { Upload } from "@/domain/entities/Upload";

export interface IUploadRepository {
  save(upload: Upload): Promise<Upload>;
}
