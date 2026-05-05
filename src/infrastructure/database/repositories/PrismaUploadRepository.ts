import { Upload } from "@/domain/entities/Upload";
import {
  type IUploadRepository,
  type UploadHistoricoItem,
} from "@/domain/repositories/IUploadRepository";
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

  async listRecent(limit: number): Promise<UploadHistoricoItem[]> {
    const uploads = await prisma.upload.findMany({
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return uploads.map((upload) => ({
      id: upload.id,
      fileName: upload.fileName,
      condicao: upload.condicao,
      totalRegistros: upload.totalRegistros,
      createdAt: upload.createdAt,
      uploadedBy: upload.user.name,
    }));
  }
}
