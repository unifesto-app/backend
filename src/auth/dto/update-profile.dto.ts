import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  Matches,
  IsUrl,
  IsPhoneNumber,
  ValidateIf,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Username can only contain letters, numbers, underscores and hyphens',
  })
  username?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  avatar_url?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @ValidateIf(
    (o) => o.phone !== '' && o.phone !== null && o.phone !== undefined,
  )
  @IsPhoneNumber(undefined, {
    message:
      'Phone must be a valid phone number (e.g., +1234567890 or +911234567890)',
  })
  phone?: string | null;
}
