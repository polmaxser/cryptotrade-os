import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
} from 'class-validator';

export class CreateNftHoldingDto {
  @IsString()
  @MinLength(1)
  collectionName!: string;

  @IsString()
  @MinLength(1)
  tokenId!: string;

  @IsOptional()
  @IsString()
  contractAddress?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  imageUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  acquiredPriceUsd?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentFloorPriceUsd?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsDateString()
  acquiredAt!: string;

  @IsOptional()
  @IsString()
  portfolioId?: string;
}
