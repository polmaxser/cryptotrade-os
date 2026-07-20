import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePromoCodeDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
