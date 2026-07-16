import { IsOptional, IsString } from 'class-validator';

export class ListDeFiPositionsDto {
  @IsOptional()
  @IsString()
  portfolioId?: string;
}
