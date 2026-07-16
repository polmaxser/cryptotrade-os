import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { DeFiPositionType } from '@cryptotrade/database';

export class CreateDeFiPositionDto {
  @IsString()
  @MinLength(1)
  protocol!: string;

  @IsEnum(DeFiPositionType)
  type!: DeFiPositionType;

  @IsString()
  @MinLength(1)
  asset!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsNumber()
  @Min(0)
  valueUsd!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  apy?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsDateString()
  openedAt!: string;

  @IsOptional()
  @IsDateString()
  closedAt?: string;

  @IsOptional()
  @IsString()
  portfolioId?: string;
}
