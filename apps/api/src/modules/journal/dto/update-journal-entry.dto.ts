import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateJournalEntryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  /** Pass null to unlink the entry from its trade. */
  @IsOptional()
  @IsString()
  tradeId?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
