import { IsString, IsOptional, IsEmail, IsBoolean, IsInt, IsObject } from 'class-validator';

export class CreateSpeakerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  profile_image_url?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsObject()
  social_links?: Record<string, string>;

  @IsOptional()
  @IsInt()
  display_order?: number;

  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;
}

export class UpdateSpeakerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  profile_image_url?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsObject()
  social_links?: Record<string, string>;

  @IsOptional()
  @IsInt()
  display_order?: number;

  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;
}
