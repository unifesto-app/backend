import { IsBoolean, IsOptional, IsObject } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsBoolean()
  push_notifications?: boolean;

  @IsOptional()
  @IsBoolean()
  email_notifications?: boolean;

  @IsOptional()
  @IsBoolean()
  event_reminders?: boolean;

  @IsOptional()
  @IsBoolean()
  marketing_emails?: boolean;

  // Allow additional custom preferences
  @IsOptional()
  @IsObject()
  [key: string]: any;
}
