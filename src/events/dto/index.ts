import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  IsArray,
  IsNumber,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EventType,
  EventVisibility,
  RegistrationType,
  FormFieldType,
} from '@prisma/client';

export class CreateEventDto {
  @ApiProperty({ example: 'Tech Conference 2024' })
  @IsString()
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional({ example: 'A great tech event' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: EventType, example: EventType.IN_PERSON })
  @IsEnum(EventType)
  type: EventType;

  @ApiProperty({
    enum: RegistrationType,
    example: RegistrationType.RSVP,
  })
  @IsEnum(RegistrationType)
  registrationType: RegistrationType;

  @ApiProperty({ example: '2024-12-25T10:00:00Z' })
  @IsDateString()
  startDateTime: string;

  @ApiProperty({ example: '2024-12-25T18:00:00Z' })
  @IsDateString()
  endDateTime: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 'Convention Center' })
  @IsOptional()
  @IsString()
  venueName?: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsOptional()
  @IsString()
  venueAddress?: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Maharashtra' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 19.076 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 72.8777 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 'https://zoom.us/meeting' })
  @IsOptional()
  @IsUrl()
  onlineUrl?: string;

  @ApiPropertyOptional({ example: 'Zoom' })
  @IsOptional()
  @IsString()
  onlinePlatform?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  waitlistEnabled?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({ example: ['tech', 'conference'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'Technology' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    enum: EventVisibility,
    example: EventVisibility.PUBLIC,
  })
  @IsEnum(EventVisibility)
  visibility: EventVisibility;

  @ApiProperty({ example: 'space-uuid' })
  @IsString()
  spaceId: string;
}

export class UpdateEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: EventType })
  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDateTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDateTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venueName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venueAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  onlineUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  waitlistEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: EventVisibility })
  @IsOptional()
  @IsEnum(EventVisibility)
  visibility?: EventVisibility;
}

export class CancelEventDto {
  @ApiProperty({ example: 'Event cancelled due to unforeseen circumstances' })
  @IsString()
  reason: string;
}

export class CreateTicketTypeDto {
  @ApiProperty({ example: 'General Admission' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Standard entry ticket' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  totalQuantity: number;

  @ApiPropertyOptional({ example: '2024-12-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  saleStartsAt?: string;

  @ApiPropertyOptional({ example: '2024-12-24T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  saleEndsAt?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  perUserLimit?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateTicketTypeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  totalQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  saleStartsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  saleEndsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateAgendaDto {
  @ApiProperty({ example: 'Opening Keynote' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Welcome address by CEO' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2024-12-25T10:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2024-12-25T11:00:00Z' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  speakerName?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class CreateSpeakerDto {
  @ApiProperty({ example: 'Jane Smith' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Tech leader and innovator' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'https://avatar.url' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'CTO' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ example: 'TechCorp' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/janesmith' })
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class CreateFormFieldDto {
  @ApiProperty({ example: 'Dietary Preference' })
  @IsString()
  label: string;

  @ApiProperty({ enum: FormFieldType, example: FormFieldType.SELECT })
  @IsEnum(FormFieldType)
  type: FormFieldType;

  @ApiPropertyOptional({ example: ['Vegetarian', 'Non-Vegetarian', 'Vegan'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class EventFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ enum: EventType })
  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  spaceId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
