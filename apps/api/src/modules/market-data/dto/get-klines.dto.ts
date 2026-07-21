import { IsDateString, IsString, MinLength } from 'class-validator';

export class GetKlinesDto {
  @IsString()
  @MinLength(1)
  symbol!: string;

  @IsString()
  @MinLength(1)
  timeframe!: string;

  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;
}
