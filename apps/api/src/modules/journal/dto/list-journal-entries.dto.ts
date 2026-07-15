import { IsOptional, IsString } from 'class-validator';

export class ListJournalEntriesDto {
  @IsOptional()
  @IsString()
  tradeId?: string;

  @IsOptional()
  @IsString()
  tagId?: string;
}
