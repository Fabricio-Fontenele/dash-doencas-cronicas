import { CareRecord } from "@/domain/entities/CareRecord";
import { type Condition } from "@/domain/value-objects/Condition";

export interface ParsedFileResult {
  condition: Condition;
  records: CareRecord[];
}

export interface IFileParser {
  parse(buffer: Buffer, fileName: string): Promise<ParsedFileResult>;
}
