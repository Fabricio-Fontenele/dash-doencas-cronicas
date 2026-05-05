import { randomUUID } from "node:crypto";

import { DomainError } from "@/domain/errors/DomainError";
import { type Condicao } from "@/domain/value-objects/Condicao";

export interface UploadProps {
  id: string;
  fileName: string;
  condicao: Condicao;
  totalRegistros: number;
  userId: string;
  createdAt: Date;
}

export interface CreateUploadProps {
  fileName: string;
  condicao: Condicao;
  totalRegistros: number;
  userId: string;
}

export class Upload {
  private constructor(private readonly props: UploadProps) {}

  static create(props: CreateUploadProps): Upload {
    if (!props.fileName.trim()) {
      throw new DomainError("Upload precisa de um nome de arquivo.");
    }

    if (!props.userId.trim()) {
      throw new DomainError("Upload precisa de um usuario responsavel.");
    }

    if (props.totalRegistros < 0) {
      throw new DomainError("Upload nao pode possuir quantidade negativa de registros.");
    }

    return new Upload({
      id: randomUUID(),
      fileName: props.fileName.trim(),
      condicao: props.condicao,
      totalRegistros: props.totalRegistros,
      userId: props.userId.trim(),
      createdAt: new Date(),
    });
  }

  get id(): string {
    return this.props.id;
  }

  toJSON(): UploadProps {
    return { ...this.props };
  }
}
