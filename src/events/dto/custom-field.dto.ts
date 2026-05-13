import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsUUID,
  IsNumber,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum FieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  EMAIL = 'email',
  PHONE = 'phone',
  NUMBER = 'number',
  DROPDOWN = 'dropdown',
  MULTI_SELECT = 'multi_select',
  RADIO = 'radio',
  DATE = 'date',
  FILE = 'file',
  CHECKBOX = 'checkbox',
  URL = 'url',
  COUNTRY = 'country',
  ID_PROOF_TYPE = 'id_proof_type',
  ID_PROOF_UPLOAD = 'id_proof_upload',
}

export class CreateCustomFieldDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  label: string;

  @IsEnum(FieldType)
  field_type: FieldType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  placeholder?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  help_text?: string;

  @IsOptional()
  @IsString()
  default_value?: string;

  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @IsOptional()
  @IsObject()
  validation_rules?: Record<string, any>;

  @IsOptional()
  @IsObject()
  options_json?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  applies_to_ticket_ids?: string[];

  @IsOptional()
  @IsNumber()
  display_order?: number;
}

export class UpdateCustomFieldDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  label?: string;

  @IsOptional()
  @IsEnum(FieldType)
  field_type?: FieldType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  placeholder?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  help_text?: string;

  @IsOptional()
  @IsString()
  default_value?: string;

  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @IsOptional()
  @IsObject()
  validation_rules?: Record<string, any>;

  @IsOptional()
  @IsObject()
  options_json?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  applies_to_ticket_ids?: string[];

  @IsOptional()
  @IsNumber()
  display_order?: number;
}
