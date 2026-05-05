import { DomainError } from "@/domain/errors/DomainError";
import { type AgeGroup } from "@/domain/value-objects/AgeGroup";
import { type Condition } from "@/domain/value-objects/Condition";

export interface AggregateBucketProps {
  uploadId: string;
  condition: Condition;
  ageGroup: AgeGroup | null;
  sex: string | null;
  raceColor: string | null;
  familyAllowance: boolean | null;
  neighborhood: string | null;
  needsMedicalCare: boolean;
  needsNursingCare: boolean;
  needsHomeVisit: boolean;
  hasStaleBloodPressureMeasurement: boolean;
  hasStaleHbA1c: boolean;
  count: number;
}

export class AggregateBucket {
  private constructor(private readonly props: AggregateBucketProps) {}

  static create(props: AggregateBucketProps): AggregateBucket {
    if (!props.uploadId.trim()) {
      throw new DomainError("Aggregate bucket requires an upload id.");
    }

    if (props.count <= 0) {
      throw new DomainError("Aggregate bucket count must be greater than zero.");
    }

    return new AggregateBucket({
      ...props,
      sex: props.sex?.trim() || null,
      raceColor: props.raceColor?.trim() || null,
      neighborhood: props.neighborhood?.trim() || null,
    });
  }

  static createKey(props: Omit<AggregateBucketProps, "uploadId" | "count">): string {
    return [
      props.condition,
      props.ageGroup ?? "null",
      props.sex ?? "null",
      props.raceColor ?? "null",
      String(props.familyAllowance),
      props.neighborhood ?? "null",
      String(props.needsMedicalCare),
      String(props.needsNursingCare),
      String(props.needsHomeVisit),
      String(props.hasStaleBloodPressureMeasurement),
      String(props.hasStaleHbA1c),
    ].join("|");
  }

  get condition(): Condition {
    return this.props.condition;
  }

  get ageGroup(): AgeGroup | null {
    return this.props.ageGroup;
  }

  get sex(): string | null {
    return this.props.sex;
  }

  get raceColor(): string | null {
    return this.props.raceColor;
  }

  get familyAllowance(): boolean | null {
    return this.props.familyAllowance;
  }

  get neighborhood(): string | null {
    return this.props.neighborhood;
  }

  get needsMedicalCare(): boolean {
    return this.props.needsMedicalCare;
  }

  get needsNursingCare(): boolean {
    return this.props.needsNursingCare;
  }

  get needsHomeVisit(): boolean {
    return this.props.needsHomeVisit;
  }

  get hasStaleBloodPressureMeasurement(): boolean {
    return this.props.hasStaleBloodPressureMeasurement;
  }

  get hasStaleHbA1c(): boolean {
    return this.props.hasStaleHbA1c;
  }

  get count(): number {
    return this.props.count;
  }

  get uploadId(): string {
    return this.props.uploadId;
  }

  toJSON(): AggregateBucketProps {
    return { ...this.props };
  }
}
