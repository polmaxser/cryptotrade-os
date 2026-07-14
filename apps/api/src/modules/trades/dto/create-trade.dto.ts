import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

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

  @IsOptional()
  @IsString()
  strategy?: string;

  @IsNumber()
  @Min(0)
  entryPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  exitPrice?: number;

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
