import { IsOptional, IsString } from 'class-validator';

export class ListNftHoldingsDto {
  @IsOptional()
  @IsString()
  portfolioId?: string;
}
