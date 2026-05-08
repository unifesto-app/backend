import { IsUUID, IsEnum, IsObject, IsOptional } from 'class-validator';

export class AddMemberDto {
  @IsUUID()
  user_id: string;

  @IsEnum(['owner', 'admin', 'organizer', 'member'])
  role: string;

  @IsObject()
  @IsOptional()
  permissions?: Record<string, any>;
}
