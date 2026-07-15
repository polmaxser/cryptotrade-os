import { IsString, IsUrl } from 'class-validator';

export class RemoveScreenshotDto {
  @IsString()
  @IsUrl({ require_tld: false })
  url!: string;
}
