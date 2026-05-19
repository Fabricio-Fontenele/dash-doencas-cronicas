import { DomainError } from "@/domain/errors/DomainError";
import { BloodPressureClassifier, type BloodPressureClassification } from "@/domain/value-objects/BloodPressureClassification";
import { BmiClassifier, type BmiClassification } from "@/domain/value-objects/BmiClassification";
import { AgeGroupCalculator, type AgeGroup } from "@/domain/value-objects/AgeGroup";
import { type ClinicalCondition } from "@/domain/value-objects/Condition";
import { HbA1cClassifier, type HbA1cClassification } from "@/domain/value-objects/HbA1cClassification";
import { IbgeRaceColorNormalizer, type IbgeRaceColor } from "@/domain/value-objects/IbgeRaceColor";

const MAX_AGE = 150;
const MEDICAL_CARE_LIMIT_IN_MONTHS = 6;
const NURSING_CARE_LIMIT_IN_MONTHS = 6;
const DENTAL_CARE_LIMIT_IN_MONTHS = 6;
const HOME_VISIT_LIMIT_IN_MONTHS = 3;
const BLOOD_PRESSURE_LIMIT_IN_MONTHS = 6;
const HBA1C_LIMIT_IN_MONTHS = 12;

export interface CareRecordProps {
  condition: ClinicalCondition;
  age: number | null;
  sex: string | null;
  raceColor: string | null;
  familyAllowance: boolean | null;
  neighborhood: string | null;
  monthsSinceMedicalAppointment: number | null;
  monthsSinceNursingAppointment: number | null;
  monthsSinceDentalAppointment: number | null;
  monthsSinceHomeVisit: number | null;
  monthsSinceBloodPressureCheck: number | null;
  monthsSinceHbA1c: number | null;
  medicalAppointmentDate: Date | null;
  nursingAppointmentDate: Date | null;
  dentalAppointmentDate: Date | null;
  homeVisitDate: Date | null;
  bloodPressureCheckDate: Date | null;
  hba1cDate: Date | null;
  weightInKilograms: number | null;
  heightInMeters: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  hba1cPercentage: number | null;
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

  get condition(): ClinicalCondition {
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

  get ibgeRaceColor(): IbgeRaceColor | null {
    return IbgeRaceColorNormalizer.normalize(this.props.raceColor);
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

  get needsDentalCare(): boolean {
    return this.isOverLimit(this.props.monthsSinceDentalAppointment, DENTAL_CARE_LIMIT_IN_MONTHS);
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

  get medicalAppointmentDate(): Date | null {
    return this.props.medicalAppointmentDate;
  }

  get nursingAppointmentDate(): Date | null {
    return this.props.nursingAppointmentDate;
  }

  get dentalAppointmentDate(): Date | null {
    return this.props.dentalAppointmentDate;
  }

  get homeVisitDate(): Date | null {
    return this.props.homeVisitDate;
  }

  get bmiValue(): number | null {
    const { weightInKilograms, heightInMeters } = this.props;

    if (
      weightInKilograms === null ||
      heightInMeters === null ||
      heightInMeters <= 0
    ) {
      return null;
    }

    return Number((weightInKilograms / (heightInMeters * heightInMeters)).toFixed(1));
  }

  get bmiClassification(): BmiClassification | null {
    return BmiClassifier.classify(this.bmiValue);
  }

  get bloodPressureClassification(): BloodPressureClassification | null {
    if (this.props.condition !== "HYPERTENSION") {
      return null;
    }

    return BloodPressureClassifier.classify(
      this.props.bloodPressureSystolic,
      this.props.bloodPressureDiastolic,
    );
  }

  get hba1cClassification(): HbA1cClassification | null {
    if (this.props.condition !== "DIABETES") {
      return null;
    }

    return HbA1cClassifier.classify(this.props.hba1cPercentage);
  }

  private isOverLimit(value: number | null, limit: number): boolean {
    return value === null || value > limit;
  }
}
