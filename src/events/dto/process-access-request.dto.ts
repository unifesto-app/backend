import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';

export class ProcessAccessRequestDto {
  @IsEnum(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @IsString()
  @IsOptional()
  @MaxLength(500)
  response_message?: string;
}
