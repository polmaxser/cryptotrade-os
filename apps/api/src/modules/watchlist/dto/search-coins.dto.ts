import { IsString, MinLength } from 'class-validator';

export class SearchCoinsDto {
  @IsString()
  @MinLength(1)
  query!: string;
}
