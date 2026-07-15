import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsString } from 'class-validator';

const MAX_SYMBOLS_PER_IMPORT = 20;

export class ImportTradesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_SYMBOLS_PER_IMPORT)
  @IsString({ each: true })
  symbols!: string[];

  @IsOptional()
  @IsString()
  portfolioId?: string;
}
