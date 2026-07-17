import { IsEnum } from 'class-validator';
import { AiReportType } from '@cryptotrade/database';

export class GenerateAiReportDto {
  @IsEnum(AiReportType)
  type!: AiReportType;
}
