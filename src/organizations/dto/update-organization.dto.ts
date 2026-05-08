import { PartialType } from '@nestjs/mapped-types';
import { CreateOrganizationDto } from './create-organization.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {
  @IsBoolean()
  @IsOptional()
  is_verified?: boolean;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
