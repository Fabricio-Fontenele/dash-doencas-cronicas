import { type CareRecord } from "@/domain/entities/CareRecord";
import { type Condition } from "@/domain/value-objects/Condition";

export interface ParsedFileCapabilities {
  supportsMedicalTimeline: boolean;
  supportsNursingTimeline: boolean;
  supportsDentalTimeline: boolean;
  supportsHomeVisitTimeline: boolean;
  supportsBmiClassification: boolean;
  supportsBloodPressureClassification: boolean;
  supportsHbA1cClassification: boolean;
}

export interface ParsedFileResult {
  condition: Condition;
  records: CareRecord[];
  capabilities: ParsedFileCapabilities;
}

export interface IFileParser {
  parse(buffer: Buffer, fileName: string): Promise<ParsedFileResult>;
}
