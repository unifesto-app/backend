import { IsOptional, IsEnum, IsUUID, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class EventQueryDto {
  @IsOptional()
  @IsUUID()
  organization_id?: string;

  @IsOptional()
  @IsEnum(['draft', 'pending', 'approved', 'rejected', 'published', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsUUID()
  created_by?: string;

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
