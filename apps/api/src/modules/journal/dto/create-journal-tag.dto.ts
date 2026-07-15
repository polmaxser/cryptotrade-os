import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { JournalTagCategory } from '@cryptotrade/database';

export class CreateJournalTagDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name!: string;

  @IsEnum(JournalTagCategory)
  category!: JournalTagCategory;
}
