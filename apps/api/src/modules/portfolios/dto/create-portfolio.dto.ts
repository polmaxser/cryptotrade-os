import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min, MaxLength } from 'class-validator';
import { PortfolioType } from '@cryptotrade/database';

export class CreatePortfolioDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(PortfolioType)
  type?: PortfolioType;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  baseCurrency?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  startingBalance?: number;
}
