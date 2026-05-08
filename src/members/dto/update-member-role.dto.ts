import { IsEnum, IsObject, IsOptional } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsEnum(['owner', 'admin', 'organizer', 'member'])
  @IsOptional()
  role?: string;

  @IsObject()
  @IsOptional()
  permissions?: Record<string, any>;
}
