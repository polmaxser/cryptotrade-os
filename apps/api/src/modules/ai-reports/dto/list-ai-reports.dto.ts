import { IsEnum, IsOptional } from 'class-validator';
import { AiReportType } from '@cryptotrade/database';

export class ListAiReportsDto {
  @IsOptional()
  @IsEnum(AiReportType)
  type?: AiReportType;
}
