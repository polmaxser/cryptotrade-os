import { IsIn } from 'class-validator';
import { CoachInsightStatus } from '@cryptotrade/database';

/** A trader can only move a finding to CONFIRMED or DISMISSED — NEW is server-assigned at creation. */
export class UpdateCoachInsightDto {
  @IsIn([CoachInsightStatus.CONFIRMED, CoachInsightStatus.DISMISSED])
  status!: typeof CoachInsightStatus.CONFIRMED | typeof CoachInsightStatus.DISMISSED;
}
