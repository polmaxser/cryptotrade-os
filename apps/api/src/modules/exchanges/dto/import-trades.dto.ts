import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
} from 'class-validator';

const MAX_SYMBOLS_PER_IMPORT = 20;

export class ImportTradesDto {
  /** Omit to sweep every symbol at once — only supported on some exchanges (see ExchangeClient.supportsAllSymbolsFetch). */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_SYMBOLS_PER_IMPORT)
  @IsString({ each: true })
  symbols?: string[];

  @IsOptional()
  @IsString()
  portfolioId?: string;

  /** Both from/to must be set together — a one-sided range isn't meaningful for a chunked fetch. */
  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
