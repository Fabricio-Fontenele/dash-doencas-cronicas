import { randomUUID } from "node:crypto";

import { DomainError } from "@/domain/errors/DomainError";
import { type Condition } from "@/domain/value-objects/Condition";

export interface UploadProps {
  id: string;
  fileName: string;
  condition: Condition;
  totalRecords: number;
  supportsMedicalTimeline: boolean;
  supportsNursingTimeline: boolean;
  supportsDentalTimeline: boolean;
  supportsHomeVisitTimeline: boolean;
  supportsBmiClassification: boolean;
  supportsBloodPressureClassification: boolean;
  supportsHbA1cClassification: boolean;
  userId: string;
  createdAt: Date;
}

export interface CreateUploadProps {
  fileName: string;
  condition: Condition;
  totalRecords: number;
  supportsMedicalTimeline: boolean;
  supportsNursingTimeline: boolean;
  supportsDentalTimeline: boolean;
  supportsHomeVisitTimeline: boolean;
  supportsBmiClassification: boolean;
  supportsBloodPressureClassification: boolean;
  supportsHbA1cClassification: boolean;
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
      supportsMedicalTimeline: props.supportsMedicalTimeline,
      supportsNursingTimeline: props.supportsNursingTimeline,
      supportsDentalTimeline: props.supportsDentalTimeline,
      supportsHomeVisitTimeline: props.supportsHomeVisitTimeline,
      supportsBmiClassification: props.supportsBmiClassification,
      supportsBloodPressureClassification: props.supportsBloodPressureClassification,
      supportsHbA1cClassification: props.supportsHbA1cClassification,
      userId: props.userId.trim(),
      createdAt: new Date(),
    });
  }

  get id(): string {
    return this.props.id;
  }

  get fileName(): string {
    return this.props.fileName;
  }

  get condition(): Condition {
    return this.props.condition;
  }

  get totalRecords(): number {
    return this.props.totalRecords;
  }

  get supportsMedicalTimeline(): boolean {
    return this.props.supportsMedicalTimeline;
  }

  get supportsNursingTimeline(): boolean {
    return this.props.supportsNursingTimeline;
  }

  get supportsDentalTimeline(): boolean {
    return this.props.supportsDentalTimeline;
  }

  get supportsHomeVisitTimeline(): boolean {
    return this.props.supportsHomeVisitTimeline;
  }

  get supportsBmiClassification(): boolean {
    return this.props.supportsBmiClassification;
  }

  get supportsBloodPressureClassification(): boolean {
    return this.props.supportsBloodPressureClassification;
  }

  get supportsHbA1cClassification(): boolean {
    return this.props.supportsHbA1cClassification;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): UploadProps {
    return { ...this.props };
  }
}
