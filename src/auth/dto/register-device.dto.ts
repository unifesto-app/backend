import {
  IsString,
  IsOptional,
  IsIn,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  @MaxLength(100)
  device_name: string;

  @IsString()
  @IsIn(['ios', 'android', 'web', 'desktop', 'unknown'])
  device_type: 'ios' | 'android' | 'web' | 'desktop' | 'unknown';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  device_model?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  os_version?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  app_version?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  device_token?: string;

  @IsString()
  @MaxLength(255)
  device_fingerprint: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ip_address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  user_agent?: string;
}

export class UpdateDeviceDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  device_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  device_token?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
