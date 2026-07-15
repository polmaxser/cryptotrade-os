import { IsString, Matches } from 'class-validator';

export class GetCalendarDto {
  /** Format: YYYY-MM */
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'month must be in YYYY-MM format' })
  month!: string;
}
