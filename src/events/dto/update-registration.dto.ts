import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateRegistrationDto {
  @IsOptional()
  @IsString()
  @IsIn(['confirmed', 'cancelled', 'waitlisted', 'checked_in'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CheckInDto {
  @IsString()
  qrCode: string;
}
