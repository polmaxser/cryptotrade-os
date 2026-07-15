import { IsString, MaxLength, MinLength } from 'class-validator';

export class RedeemPromoCodeDto {
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  code!: string;
}
