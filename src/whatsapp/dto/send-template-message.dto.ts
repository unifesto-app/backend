import { IsString, IsNotEmpty, IsOptional, Matches, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class TemplateParameterDto {
  @IsString()
  @IsNotEmpty()
  type: string; // 'text', 'currency', 'date_time', 'image', 'document', 'video'

  @IsString()
  @IsOptional()
  text?: string;

  @IsString()
  @IsOptional()
  parameter_name?: string; // For named parameters

  @IsObject()
  @IsOptional()
  currency?: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };

  @IsObject()
  @IsOptional()
  date_time?: {
    fallback_value: string;
  };

  @IsObject()
  @IsOptional()
  image?: {
    link?: string;
    id?: string;
  };

  @IsObject()
  @IsOptional()
  document?: {
    link?: string;
    id?: string;
    filename?: string;
  };

  @IsObject()
  @IsOptional()
  video?: {
    link?: string;
    id?: string;
  };
}

class TemplateComponentDto {
  @IsString()
  @IsNotEmpty()
  type: string; // 'header', 'body', 'button'

  @IsString()
  @IsOptional()
  sub_type?: string; // For buttons: 'quick_reply', 'url'

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateParameterDto)
  @IsOptional()
  parameters?: TemplateParameterDto[];

  @IsString()
  @IsOptional()
  index?: string; // For buttons
}

class TemplateLanguageDto {
  @IsString()
  @IsNotEmpty()
  code: string; // e.g., 'en_US', 'es_MX'

  @IsString()
  @IsOptional()
  policy?: string; // 'deterministic' or 'fallback'
}

class TemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @ValidateNested()
  @Type(() => TemplateLanguageDto)
  language: TemplateLanguageDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateComponentDto)
  @IsOptional()
  components?: TemplateComponentDto[];
}

export class SendTemplateMessageDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10,15}$/, {
    message: 'Phone number must be 10-15 digits with country code (e.g., 919876543210)',
  })
  to: string;

  @ValidateNested()
  @Type(() => TemplateDto)
  template: TemplateDto;

  @IsString()
  @IsOptional()
  event_id?: string;
}
