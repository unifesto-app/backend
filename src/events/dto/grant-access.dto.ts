import { IsUUID, IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class GrantAccessDto {
  @IsUUID()
  user_id: string;

  // Tab-level permissions
  @IsBoolean()
  @IsOptional()
  can_view_overview?: boolean;

  @IsBoolean()
  @IsOptional()
  can_edit_details?: boolean;

  @IsBoolean()
  @IsOptional()
  can_manage_attendees?: boolean;

  @IsBoolean()
  @IsOptional()
  can_manage_volunteers?: boolean;

  @IsBoolean()
  @IsOptional()
  can_manage_checkin?: boolean;

  @IsBoolean()
  @IsOptional()
  can_manage_tickets?: boolean;

  @IsBoolean()
  @IsOptional()
  can_manage_payments?: boolean;

  @IsBoolean()
  @IsOptional()
  can_manage_content?: boolean;

  @IsBoolean()
  @IsOptional()
  can_manage_campaigns?: boolean;

  @IsBoolean()
  @IsOptional()
  can_manage_discussion?: boolean;

  @IsBoolean()
  @IsOptional()
  can_view_analytics?: boolean;

  @IsBoolean()
  @IsOptional()
  can_manage_certificates?: boolean;

  @IsBoolean()
  @IsOptional()
  can_manage_settings?: boolean;

  @IsBoolean()
  @IsOptional()
  can_manage_access?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
