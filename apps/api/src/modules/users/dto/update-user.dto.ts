import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
