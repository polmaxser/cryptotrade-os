import { IsEnum, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
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

  /** Required for exchanges (e.g. OKX) that set a passphrase at API key creation time. */
  @ValidateIf((dto: CreateExchangeConnectionDto) => dto.exchange === ExchangeProvider.OKX)
  @IsString()
  @MinLength(1)
  apiPassphrase?: string;
}
