import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { MarginType } from '@cryptotrade/database';

export enum TradeSide {
  LONG = 'LONG',
  SHORT = 'SHORT',
}

export enum TradeStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export class CreateTradeDto {
  @IsString()
  symbol!: string;

  @IsEnum(TradeSide)
  side!: TradeSide;

  /** Free-text legacy label — see CreateStrategyDto/strategyId for the formal Strategy entity. */
  @IsOptional()
  @IsString()
  strategy?: string;

  @IsOptional()
  @IsString()
  strategyId?: string;

  @IsNumber()
  @Min(0)
  entryPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  exitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stopLossPrice?: number;

  /** Futures-only. */
  @IsOptional()
  @IsInt()
  @Min(1)
  leverage?: number;

  /** Futures-only. */
  @IsOptional()
  @IsEnum(MarginType)
  marginType?: MarginType;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsOptional()
  @IsNumber()
  pnl?: number;

  @IsOptional()
  @IsNumber()
  pnlPercent?: number;

  @IsOptional()
  @IsEnum(TradeStatus)
  status?: TradeStatus;

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
