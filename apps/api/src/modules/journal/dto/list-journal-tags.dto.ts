import { IsEnum, IsOptional } from 'class-validator';
import { JournalTagCategory } from '@cryptotrade/database';

export class ListJournalTagsDto {
  @IsOptional()
  @IsEnum(JournalTagCategory)
  category?: JournalTagCategory;
}
