"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ProcessarUploadUseCase } from "@/application/use-cases/upload/ProcessarUploadUseCase";
import { prisma } from "@/infrastructure/database/prisma/client";
import { PrismaPacienteRepository } from "@/infrastructure/database/repositories/PrismaPacienteRepository";
import { PrismaUploadRepository } from "@/infrastructure/database/repositories/PrismaUploadRepository";
import { FileParsingError } from "@/infrastructure/parsers/errors/FileParsingError";
import { SheetJSFileParser } from "@/infrastructure/parsers/SheetJSFileParser";

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

export interface UploadActionState {
  status: "idle" | "success" | "error";
  message: string | null;
  uploadedFileName: string | null;
}

export const initialUploadActionState: UploadActionState = {
  status: "idle",
  message: null,
  uploadedFileName: null,
};

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

    const useCase = new ProcessarUploadUseCase(
      new SheetJSFileParser(),
      new PrismaUploadRepository(),
      new PrismaPacienteRepository(),
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
      message: `${result.totalRegistros} pacientes importados em ${result.condicao.toLowerCase()}.`,
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
