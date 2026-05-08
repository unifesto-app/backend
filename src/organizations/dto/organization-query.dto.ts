import { IsOptional, IsEnum, IsBoolean, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class OrganizationQueryDto {
  @IsOptional()
  @IsEnum(['owner', 'admin', 'organizer', 'member'])
  role?: string;

  @IsOptional()
  @IsEnum(['university', 'college', 'club', 'community'])
  type?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
