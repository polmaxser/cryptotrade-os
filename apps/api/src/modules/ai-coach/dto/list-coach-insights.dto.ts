import { IsEnum, IsOptional } from 'class-validator';
import { CoachInsightStatus } from '@cryptotrade/database';

export class ListCoachInsightsDto {
  @IsOptional()
  @IsEnum(CoachInsightStatus)
  status?: CoachInsightStatus;
}
