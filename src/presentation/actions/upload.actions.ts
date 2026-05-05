"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ProcessUploadUseCase } from "@/application/use-cases/upload/ProcessUploadUseCase";
import { prisma } from "@/infrastructure/database/prisma/client";
import { PrismaAggregateBucketRepository } from "@/infrastructure/database/repositories/PrismaAggregateBucketRepository";
import { PrismaUploadRepository } from "@/infrastructure/database/repositories/PrismaUploadRepository";
import { FileParsingError } from "@/infrastructure/parsers/errors/FileParsingError";
import { SheetJSFileParser } from "@/infrastructure/parsers/SheetJSFileParser";
import { type UploadActionState } from "@/presentation/actions/upload-action-state";

const MAX_FILE_SIZE_IN_BYTES = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".csv", ".xls", ".xlsx"] as const;

const uploadInputSchema = z.object({
  file: z
    .instanceof(File, { message: "Selecione um arquivo para importar." })
    .refine((file) => file.size > 0, "Selecione um arquivo para importar.")
    .refine(
      (file) => file.size <= MAX_FILE_SIZE_IN_BYTES,
      "O arquivo excede o limite de 10 MB.",
    )
    .refine(
      (file) =>
        ACCEPTED_EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension)),
      "Envie um arquivo CSV, XLS ou XLSX.",
    ),
});

export async function processUploadAction(
  _previousState: UploadActionState,
  formData: FormData,
): Promise<UploadActionState> {
  const parsedInput = uploadInputSchema.safeParse({
    file: formData.get("file"),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues[0]?.message ?? "Arquivo invalido para importacao.",
      uploadedFileName: null,
    };
  }

  try {
    const uploaderUserId = await ensureUploaderUser();
    const fileBuffer = Buffer.from(await parsedInput.data.file.arrayBuffer());

    const useCase = new ProcessUploadUseCase(
      new SheetJSFileParser(),
      new PrismaUploadRepository(),
      new PrismaAggregateBucketRepository(),
    );

    const result = await useCase.execute({
      buffer: fileBuffer,
      fileName: parsedInput.data.file.name,
      userId: uploaderUserId,
    });

    revalidatePath("/");
    revalidatePath("/importar");

    return {
      status: "success",
      message: `${result.totalRecords} registros agregados importados em ${formatConditionLabel(result.condition)}.`,
      uploadedFileName: result.fileName,
    };
  } catch (error) {
    if (error instanceof FileParsingError || error instanceof Error) {
      return {
        status: "error",
        message: error.message,
        uploadedFileName: null,
      };
    }

    return {
      status: "error",
      message: "Falha inesperada ao processar o upload.",
      uploadedFileName: null,
    };
  }
}

function formatConditionLabel(condition: "DIABETES" | "HYPERTENSION"): string {
  return condition === "DIABETES" ? "diabetes" : "hipertensao";
}

async function ensureUploaderUser(): Promise<string> {
  const existingUser = await prisma.user.findFirst({
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    return existingUser.id;
  }

  const createdUser = await prisma.user.create({
    data: {
      name: "Enfermeiro Responsavel",
      email: "enfermeiro.local@dashboard-cronico.dev",
      passwordHash: "auth-pending",
      perfil: "ENFERMEIRO",
    },
    select: {
      id: true,
    },
  });

  return createdUser.id;
}
