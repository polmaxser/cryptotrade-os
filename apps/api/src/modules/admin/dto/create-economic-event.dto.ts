import { EconomicEventCategory, EconomicEventImportance } from '@cryptotrade/database';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateEconomicEventDto {
  @IsEnum(EconomicEventCategory)
  category!: EconomicEventCategory;

  @IsEnum(EconomicEventImportance)
  importance!: EconomicEventImportance;

  @IsOptional()
  @IsString()
  country?: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  eventDate!: string;

  @IsOptional()
  @IsString()
  forecast?: string;

  @IsOptional()
  @IsString()
  previous?: string;

  @IsOptional()
  @IsString()
  actual?: string;
}
