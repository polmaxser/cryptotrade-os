import { SubscriptionPlan } from '@cryptotrade/database';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePromoCodeDto {
  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(SubscriptionPlan)
  grantsPlan!: SubscriptionPlan;

  @IsInt()
  @Min(1)
  freeDays!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxRedemptions?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
