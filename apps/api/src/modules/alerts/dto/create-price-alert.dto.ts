import { IsEnum, IsNumber, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { AlertDirection } from '@cryptotrade/database';

export class CreatePriceAlertDto {
  @IsString()
  @MinLength(1)
  coinId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  symbol!: string;

  @IsEnum(AlertDirection)
  direction!: AlertDirection;

  @IsNumber()
  @Min(0)
  targetPrice!: number;
}
