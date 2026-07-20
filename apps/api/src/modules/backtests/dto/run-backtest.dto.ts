import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { BacktestTemplate } from '@cryptotrade/database';

export class RunBacktestDto {
  @IsEnum(BacktestTemplate)
  template!: BacktestTemplate;

  @IsString()
  symbol!: string;

  @IsString()
  timeframe!: string;

  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;

  @IsNumber()
  @Min(1)
  startingCapital!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  feePercent?: number;

  /** Template-specific numeric params — validated per-template in BacktestsService. */
  @IsObject()
  params!: Record<string, number>;

  @IsOptional()
  @IsString()
  strategyId?: string;
}
