import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  eventReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  newEvents?: boolean;

  @IsOptional()
  @IsBoolean()
  referralUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  promotions?: boolean;
}
