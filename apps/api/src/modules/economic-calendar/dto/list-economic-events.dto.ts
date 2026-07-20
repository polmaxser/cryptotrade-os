import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { EconomicEventCategory } from '@cryptotrade/database';

export class ListEconomicEventsDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;

  @IsOptional()
  @IsEnum(EconomicEventCategory)
  category?: EconomicEventCategory;
}
