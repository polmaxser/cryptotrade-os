import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateStrategyDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  entryCriteria?: string;

  @IsOptional()
  @IsString()
  exitCriteria?: string;

  @IsOptional()
  @IsString()
  riskManagement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  timeframe?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
