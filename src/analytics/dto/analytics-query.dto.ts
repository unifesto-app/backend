import { IsOptional, IsDateString, IsArray, IsString } from 'class-validator';

export class AnalyticsQueryDto {
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metrics?: string[];
}
