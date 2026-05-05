import { DomainError } from "@/domain/errors/DomainError";
import { type Condicao } from "@/domain/value-objects/Condicao";
import { FaixaEtariaCalculator, type FaixaEtaria } from "@/domain/value-objects/FaixaEtaria";

const MAX_PATIENT_AGE = 150;
const MEDICAL_CARE_LIMIT_IN_MONTHS = 6;
const NURSING_CARE_LIMIT_IN_MONTHS = 6;
const HOME_VISIT_LIMIT_IN_MONTHS = 3;
const BLOOD_PRESSURE_LIMIT_IN_MONTHS = 6;
const HBA1C_LIMIT_IN_MONTHS = 12;

export interface PacienteProps {
  id: string;
  nome: string;
  condicao: Condicao;
  idade: number | null;
  sexo: string | null;
  racaCor: string | null;
  bolsaFamilia: boolean | null;
  bairro: string | null;
  mesesUltimoAtendMedico: number | null;
  mesesUltimoAtendEnfermagem: number | null;
  mesesUltimaVisitaDomiciliar: number | null;
  mesesUltimaMedicaoPressaoArterial: number | null;
  mesesUltimaHbA1c: number | null;
}

export class Paciente {
  private constructor(private readonly props: PacienteProps) {}

  static create(props: PacienteProps): Paciente {
    Paciente.validate(props);
    return new Paciente({
      ...props,
      nome: props.nome.trim(),
      bairro: props.bairro?.trim() || null,
      sexo: props.sexo?.trim() || null,
      racaCor: props.racaCor?.trim() || null,
    });
  }

  private static validate(props: PacienteProps): void {
    if (!props.id.trim()) {
      throw new DomainError("Paciente precisa de um identificador.");
    }

    if (!props.nome.trim()) {
      throw new DomainError("Paciente precisa de um nome.");
    }

    if (props.idade !== null && (props.idade < 0 || props.idade > MAX_PATIENT_AGE)) {
      throw new DomainError("Idade invalida para paciente.");
    }
  }

  get id(): string {
    return this.props.id;
  }

  get nome(): string {
    return this.props.nome;
  }

  get condicao(): Condicao {
    return this.props.condicao;
  }

  get idade(): number | null {
    return this.props.idade;
  }

  get sexo(): string | null {
    return this.props.sexo;
  }

  get racaCor(): string | null {
    return this.props.racaCor;
  }

  get bolsaFamilia(): boolean | null {
    return this.props.bolsaFamilia;
  }

  get bairro(): string | null {
    return this.props.bairro;
  }

  get mesesUltimoAtendMedico(): number | null {
    return this.props.mesesUltimoAtendMedico;
  }

  get mesesUltimoAtendEnfermagem(): number | null {
    return this.props.mesesUltimoAtendEnfermagem;
  }

  get mesesUltimaVisitaDomiciliar(): number | null {
    return this.props.mesesUltimaVisitaDomiciliar;
  }

  get mesesUltimaMedicaoPressaoArterial(): number | null {
    return this.props.mesesUltimaMedicaoPressaoArterial;
  }

  get mesesUltimaHbA1c(): number | null {
    return this.props.mesesUltimaHbA1c;
  }

  get faixaEtaria(): FaixaEtaria | null {
    return FaixaEtariaCalculator.fromAge(this.props.idade);
  }

  get needsMedicalCare(): boolean {
    return this.isOverLimit(this.props.mesesUltimoAtendMedico, MEDICAL_CARE_LIMIT_IN_MONTHS);
  }

  get needsNursingCare(): boolean {
    return this.isOverLimit(this.props.mesesUltimoAtendEnfermagem, NURSING_CARE_LIMIT_IN_MONTHS);
  }

  get needsHomeVisit(): boolean {
    return this.isOverLimit(this.props.mesesUltimaVisitaDomiciliar, HOME_VISIT_LIMIT_IN_MONTHS);
  }

  get hasStaleBloodPressureMeasurement(): boolean {
    return this.isOverLimit(
      this.props.mesesUltimaMedicaoPressaoArterial,
      BLOOD_PRESSURE_LIMIT_IN_MONTHS,
    );
  }

  get hasStaleHbA1c(): boolean {
    if (this.props.condicao !== "DIABETES") {
      return false;
    }

    return this.isOverLimit(this.props.mesesUltimaHbA1c, HBA1C_LIMIT_IN_MONTHS);
  }

  toJSON(): PacienteProps {
    return { ...this.props };
  }

  private isOverLimit(value: number | null, limit: number): boolean {
    return value === null || value > limit;
  }
}
