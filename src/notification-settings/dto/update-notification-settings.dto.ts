import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  chatMessages?: boolean;

  @IsOptional()
  @IsBoolean()
  eventReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  registrationUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  walletUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  spaceUpdates?: boolean;
}
