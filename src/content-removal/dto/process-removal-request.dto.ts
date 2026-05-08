import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';

export class ProcessRemovalRequestDto {
  @IsEnum(['approved', 'rejected'])
  status: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
