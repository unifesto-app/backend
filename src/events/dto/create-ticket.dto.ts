import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsArray,
  IsUUID,
  Min,
  Max,
  ValidateIf,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum TicketType {
  INDIVIDUAL = 'individual',
  GROUP = 'group',
}

export enum PriceType {
  PER_PERSON = 'per_person',
  PER_GROUP = 'per_group',
}

export enum TicketVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  DRAFT = 'draft',
}

export class CreateTicketDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(TicketType)
  type: TicketType;

  @IsEnum(PriceType)
  price_type: PriceType;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  // Group ticket specific fields
  @ValidateIf((o) => o.type === TicketType.GROUP)
  @IsNumber()
  @Min(2)
  group_size?: number;

  @IsOptional()
  @IsBoolean()
  allow_partial_group?: boolean;

  @IsOptional()
  @IsBoolean()
  require_all_member_details?: boolean;

  @IsOptional()
  @IsBoolean()
  group_leader_required?: boolean;

  // Availability
  @IsNumber()
  @Min(0)
  quantity_available: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  min_purchase?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_purchase?: number;

  // Sales period
  @IsOptional()
  @IsDateString()
  sales_start?: string;

  @IsOptional()
  @IsDateString()
  sales_end?: string;

  // Visibility
  @IsOptional()
  @IsEnum(TicketVisibility)
  visibility?: TicketVisibility;

  // Features
  @IsOptional()
  @IsBoolean()
  is_early_bird?: boolean;

  @IsOptional()
  @IsBoolean()
  promo_code_applicable?: boolean;

  @IsOptional()
  @IsBoolean()
  is_refundable?: boolean;

  @IsOptional()
  @IsBoolean()
  seat_selection_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  tax_included?: boolean;

  @IsOptional()
  @IsBoolean()
  qr_enabled?: boolean;

  @IsOptional()
  @IsNumber()
  display_order?: number;
}
