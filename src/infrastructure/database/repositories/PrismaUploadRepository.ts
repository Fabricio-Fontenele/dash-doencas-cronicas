import { Upload } from "@/domain/entities/Upload";
import { type IUploadRepository } from "@/domain/repositories/IUploadRepository";
import { prisma } from "@/infrastructure/database/prisma/client";

export class PrismaUploadRepository implements IUploadRepository {
  async save(upload: Upload): Promise<Upload> {
    const data = upload.toJSON();

    await prisma.upload.create({
      data: {
        id: data.id,
        fileName: data.fileName,
        condicao: data.condicao,
        totalRegistros: data.totalRegistros,
        userId: data.userId,
        createdAt: data.createdAt,
      },
    });

    return upload;
  }
}
