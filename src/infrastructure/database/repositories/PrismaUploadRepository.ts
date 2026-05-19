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
        supportsMedicalTimeline: data.supportsMedicalTimeline,
        supportsNursingTimeline: data.supportsNursingTimeline,
        supportsDentalTimeline: data.supportsDentalTimeline,
        supportsHomeVisitTimeline: data.supportsHomeVisitTimeline,
        supportsBmiClassification: data.supportsBmiClassification,
        supportsBloodPressureClassification: data.supportsBloodPressureClassification,
        supportsHbA1cClassification: data.supportsHbA1cClassification,
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
      supportsMedicalTimeline: upload.supportsMedicalTimeline,
      supportsNursingTimeline: upload.supportsNursingTimeline,
      supportsDentalTimeline: upload.supportsDentalTimeline,
      supportsHomeVisitTimeline: upload.supportsHomeVisitTimeline,
      supportsBmiClassification: upload.supportsBmiClassification,
      supportsBloodPressureClassification: upload.supportsBloodPressureClassification,
      supportsHbA1cClassification: upload.supportsHbA1cClassification,
      createdAt: upload.createdAt,
      uploadedBy: upload.user.name,
    }));
  }
}
