import { Upload } from "@/domain/entities/Upload";
import {
  type IUploadRepository,
  type UploadHistoryItem,
} from "@/domain/repositories/IUploadRepository";
import { prisma } from "@/infrastructure/database/prisma/client";

export class PrismaUploadRepository implements IUploadRepository {
  async save(upload: Upload): Promise<Upload> {
    const data = upload.toJSON();

    await prisma.upload.create({
      data: {
        id: data.id,
        fileName: data.fileName,
        condition: data.condition,
        totalRecords: data.totalRecords,
        userId: data.userId,
        createdAt: data.createdAt,
      },
    });

    return upload;
  }

  async listRecent(limit: number): Promise<UploadHistoryItem[]> {
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
      condition: upload.condition,
      totalRecords: upload.totalRecords,
      createdAt: upload.createdAt,
      uploadedBy: upload.user.name,
    }));
  }
}
