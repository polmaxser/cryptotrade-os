import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { ExchangeProvider } from '@cryptotrade/database';

export class CreateExchangeConnectionDto {
  @IsEnum(ExchangeProvider)
  exchange!: ExchangeProvider;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  label!: string;

  @IsString()
  @MinLength(1)
  apiKey!: string;

  @IsString()
  @MinLength(1)
  apiSecret!: string;
}
