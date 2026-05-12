import { IsString, IsOptional, MaxLength, IsObject } from 'class-validator';

export class RequestAccessDto {
  @IsObject()
  requested_permissions: {
    can_view_overview?: boolean;
    can_edit_details?: boolean;
    can_manage_attendees?: boolean;
    can_manage_volunteers?: boolean;
    can_manage_checkin?: boolean;
    can_manage_tickets?: boolean;
    can_manage_payments?: boolean;
    can_manage_content?: boolean;
    can_manage_campaigns?: boolean;
    can_manage_discussion?: boolean;
    can_view_analytics?: boolean;
    can_manage_certificates?: boolean;
    can_manage_settings?: boolean;
    can_manage_access?: boolean;
  };

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  reason?: string;
}
