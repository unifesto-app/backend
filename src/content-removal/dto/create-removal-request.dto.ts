import {
  IsUUID,
  IsEnum,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateRemovalRequestDto {
  @IsUUID()
  organization_id: string;

  @IsEnum(['event', 'post', 'comment'])
  content_type: string;

  @IsUUID()
  content_id: string;

  @IsEnum(['transfer', 'delete', 'anonymize'])
  action: string;

  @IsUUID()
  @IsOptional()
  transfer_to_user_id?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
