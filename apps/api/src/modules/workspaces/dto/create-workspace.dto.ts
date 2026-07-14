import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug may only contain lowercase letters, numbers and hyphens',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  description?: string;
}
