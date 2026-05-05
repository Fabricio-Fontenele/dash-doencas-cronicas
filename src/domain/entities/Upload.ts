import { randomUUID } from "node:crypto";

import { DomainError } from "@/domain/errors/DomainError";
import { type Condition } from "@/domain/value-objects/Condition";

export interface UploadProps {
  id: string;
  fileName: string;
  condition: Condition;
  totalRecords: number;
  userId: string;
  createdAt: Date;
}

export interface CreateUploadProps {
  fileName: string;
  condition: Condition;
  totalRecords: number;
  userId: string;
}

export class Upload {
  private constructor(private readonly props: UploadProps) {}

  static create(props: CreateUploadProps): Upload {
    if (!props.fileName.trim()) {
      throw new DomainError("Upload requires a file name.");
    }

    if (!props.userId.trim()) {
      throw new DomainError("Upload requires an uploader user.");
    }

    if (props.totalRecords < 0) {
      throw new DomainError("Upload cannot have a negative record count.");
    }

    return new Upload({
      id: randomUUID(),
      fileName: props.fileName.trim(),
      condition: props.condition,
      totalRecords: props.totalRecords,
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
