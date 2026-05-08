import { IsString, IsOptional, MaxLength } from 'class-validator';

export class ApproveEventDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
