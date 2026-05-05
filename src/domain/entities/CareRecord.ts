import { DomainError } from "@/domain/errors/DomainError";
import { AgeGroupCalculator, type AgeGroup } from "@/domain/value-objects/AgeGroup";
import { type Condition } from "@/domain/value-objects/Condition";

const MAX_AGE = 150;
const MEDICAL_CARE_LIMIT_IN_MONTHS = 6;
const NURSING_CARE_LIMIT_IN_MONTHS = 6;
const HOME_VISIT_LIMIT_IN_MONTHS = 3;
const BLOOD_PRESSURE_LIMIT_IN_MONTHS = 6;
const HBA1C_LIMIT_IN_MONTHS = 12;

export interface CareRecordProps {
  condition: Condition;
  age: number | null;
  sex: string | null;
  raceColor: string | null;
  familyAllowance: boolean | null;
  neighborhood: string | null;
  monthsSinceMedicalAppointment: number | null;
  monthsSinceNursingAppointment: number | null;
  monthsSinceHomeVisit: number | null;
  monthsSinceBloodPressureCheck: number | null;
  monthsSinceHbA1c: number | null;
}

export class CareRecord {
  private constructor(private readonly props: CareRecordProps) {}

  static create(props: CareRecordProps): CareRecord {
    if (props.age !== null && (props.age < 0 || props.age > MAX_AGE)) {
      throw new DomainError("Record age is invalid.");
    }

    return new CareRecord({
      ...props,
      sex: props.sex?.trim() || null,
      raceColor: props.raceColor?.trim() || null,
      neighborhood: props.neighborhood?.trim() || null,
    });
  }

  get condition(): Condition {
    return this.props.condition;
  }

  get ageGroup(): AgeGroup | null {
    return AgeGroupCalculator.fromAge(this.props.age);
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
    return this.isOverLimit(this.props.monthsSinceMedicalAppointment, MEDICAL_CARE_LIMIT_IN_MONTHS);
  }

  get needsNursingCare(): boolean {
    return this.isOverLimit(this.props.monthsSinceNursingAppointment, NURSING_CARE_LIMIT_IN_MONTHS);
  }

  get needsHomeVisit(): boolean {
    return this.isOverLimit(this.props.monthsSinceHomeVisit, HOME_VISIT_LIMIT_IN_MONTHS);
  }

  get hasStaleBloodPressureMeasurement(): boolean {
    return this.isOverLimit(
      this.props.monthsSinceBloodPressureCheck,
      BLOOD_PRESSURE_LIMIT_IN_MONTHS,
    );
  }

  get hasStaleHbA1c(): boolean {
    if (this.props.condition !== "DIABETES") {
      return false;
    }

    return this.isOverLimit(this.props.monthsSinceHbA1c, HBA1C_LIMIT_IN_MONTHS);
  }

  private isOverLimit(value: number | null, limit: number): boolean {
    return value === null || value > limit;
  }
}
