import { IsString, MaxLength, MinLength } from 'class-validator';

export class AddWatchlistItemDto {
  @IsString()
  @MinLength(1)
  coinId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  symbol!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}
