import {
  IsString,
  IsUUID,
  IsOptional,
  IsDateString,
  IsUrl,
  MinLength,
  MaxLength,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsArray,
  Min,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  short_description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  slug?: string;

  @IsUUID()
  organization_id: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsDateString()
  @IsOptional()
  registration_start?: string;

  @IsDateString()
  @IsOptional()
  registration_end?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  venue?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  state?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @IsEnum(['online', 'offline', 'hybrid'])
  event_type: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsUrl()
  @IsOptional()
  @MaxLength(1000)
  image_url?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  max_attendees?: number;

  @IsBoolean()
  @IsOptional()
  is_free?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;

  @IsBoolean()
  @IsOptional()
  is_trending?: boolean;

  @IsBoolean()
  @IsOptional()
  is_featured?: boolean;
}
