import { DomainError } from "@/domain/errors/DomainError";
import { type AgeGroup } from "@/domain/value-objects/AgeGroup";
import { type ClinicalCondition } from "@/domain/value-objects/Condition";
import { type IbgeRaceColor } from "@/domain/value-objects/IbgeRaceColor";
import { type TimelineProfession } from "@/domain/value-objects/Profession";

export interface CareEventBucketProps {
  uploadId: string;
  condition: ClinicalCondition;
  profession: TimelineProfession;
  eventDate: Date;
  ageGroup: AgeGroup | null;
  sex: string | null;
  raceColor: string | null;
  ibgeRaceColor: IbgeRaceColor | null;
  familyAllowance: boolean | null;
  neighborhood: string | null;
  count: number;
}

export class CareEventBucket {
  private constructor(private readonly props: CareEventBucketProps) {}

  static create(props: CareEventBucketProps): CareEventBucket {
    if (!props.uploadId.trim()) {
      throw new DomainError("Care event bucket requires an upload id.");
    }

    if (props.count <= 0) {
      throw new DomainError("Care event bucket count must be greater than zero.");
    }

    return new CareEventBucket({
      ...props,
      sex: props.sex?.trim() || null,
      raceColor: props.raceColor?.trim() || null,
      neighborhood: props.neighborhood?.trim() || null,
    });
  }

  static createKey(props: Omit<CareEventBucketProps, "uploadId" | "count">): string {
    return [
      props.condition,
      props.profession,
      props.eventDate.toISOString().slice(0, 10),
      props.ageGroup ?? "null",
      props.sex ?? "null",
      props.raceColor ?? "null",
      props.ibgeRaceColor ?? "null",
      String(props.familyAllowance),
      props.neighborhood ?? "null",
    ].join("|");
  }

  toJSON(): CareEventBucketProps {
    return { ...this.props };
  }

  get condition(): ClinicalCondition {
    return this.props.condition;
  }

  get profession(): TimelineProfession {
    return this.props.profession;
  }

  get eventDate(): Date {
    return this.props.eventDate;
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

  get ibgeRaceColor(): IbgeRaceColor | null {
    return this.props.ibgeRaceColor;
  }

  get familyAllowance(): boolean | null {
    return this.props.familyAllowance;
  }

  get neighborhood(): string | null {
    return this.props.neighborhood;
  }

  get count(): number {
    return this.props.count;
  }
}
