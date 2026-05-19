import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsEnum, IsBoolean, IsObject, Matches, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum TemplateCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  MARKETING = 'MARKETING',
  UTILITY = 'UTILITY',
}

export enum TemplateType {
  DEFAULT = 'DEFAULT',
  CATALOGUE = 'CATALOGUE',
  FLOWS = 'FLOWS',
  ORDER_DETAILS = 'ORDER_DETAILS',
  ORDER_STATUS = 'ORDER_STATUS',
  CALLING_PERMISSIONS_REQUEST = 'CALLING_PERMISSIONS_REQUEST',
}

export enum ParameterFormat {
  NAMED = 'named',
  POSITIONAL = 'positional',
}

export enum HeaderFormat {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  LOCATION = 'LOCATION',
}

export enum ButtonType {
  QUICK_REPLY = 'QUICK_REPLY',
  URL = 'URL',
  PHONE_NUMBER = 'PHONE_NUMBER',
  COPY_CODE = 'COPY_CODE',
  OTP = 'OTP',
  FLOW = 'FLOW',
  CATALOG = 'CATALOG',
}

class TemplateButtonDto {
  @IsEnum(ButtonType)
  type: ButtonType;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsOptional()
  url?: string; // For URL buttons

  @IsString()
  @IsOptional()
  phone_number?: string; // For phone buttons

  @IsString()
  @IsOptional()
  example?: string; // For dynamic URL buttons

  @IsString()
  @IsOptional()
  flow_id?: string; // For Flow buttons

  @IsString()
  @IsOptional()
  flow_action?: string; // For Flow buttons: 'navigate' or 'data_exchange'

  @IsString()
  @IsOptional()
  otp_type?: string; // For OTP buttons: 'COPY_CODE' or 'ONE_TAP'

  @IsString()
  @IsOptional()
  autofill_text?: string; // For OTP autofill

  @IsString()
  @IsOptional()
  package_name?: string; // For OTP Android package

  @IsString()
  @IsOptional()
  signature_hash?: string; // For OTP Android signature
}

class TemplateExampleDto {
  @IsArray()
  @IsOptional()
  header_text?: string[];

  @IsArray()
  @IsOptional()
  header_handle?: string[]; // For media headers

  @IsArray()
  @IsOptional()
  body_text?: string[][]; // For positional parameters

  @IsArray()
  @IsOptional()
  body_text_named_params?: Array<{ param_name: string; example: string }>; // For named parameters
}

class TemplateComponentCreateDto {
  @IsString()
  @IsNotEmpty()
  type: string; // 'HEADER', 'BODY', 'FOOTER', 'BUTTONS', 'CAROUSEL'

  @IsEnum(HeaderFormat)
  @IsOptional()
  format?: HeaderFormat; // For HEADER component

  @IsString()
  @IsOptional()
  @Matches(/^.{0,60}$/, { message: 'Header text must be 60 characters or less' })
  text?: string; // For TEXT components

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateButtonDto)
  @IsOptional()
  @Max(10, { message: 'Maximum 10 buttons allowed' })
  buttons?: TemplateButtonDto[];

  @IsObject()
  @ValidateNested()
  @Type(() => TemplateExampleDto)
  @IsOptional()
  example?: TemplateExampleDto; // Example values for parameters

  @IsBoolean()
  @IsOptional()
  add_security_recommendation?: boolean; // For OTP templates
}

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_]+$/, {
    message: 'Template name must contain only lowercase letters, numbers, and underscores',
  })
  @Matches(/^.{1,512}$/, {
    message: 'Template name must be between 1 and 512 characters',
  })
  name: string;

  @IsEnum(TemplateCategory)
  category: TemplateCategory;

  @IsEnum(TemplateType)
  @IsOptional()
  template_type?: TemplateType;

  @IsString()
  @IsNotEmpty()
  language: string; // e.g., 'en_US', 'en', 'es_MX'

  @IsEnum(ParameterFormat)
  @IsOptional()
  parameter_format?: ParameterFormat;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateComponentCreateDto)
  components: TemplateComponentCreateDto[];

  @IsBoolean()
  @IsOptional()
  allow_category_change?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(60)
  @Max(600)
  message_send_ttl_seconds?: number; // Message validity period (60s to 600s for utility messages)
}
