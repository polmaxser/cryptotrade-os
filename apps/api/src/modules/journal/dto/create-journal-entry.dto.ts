import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateJournalEntryDto {
  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsString()
  tradeId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
