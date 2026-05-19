import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10,15}$/, {
    message: 'Phone number must be 10-15 digits with country code (e.g., 919876543210)',
  })
  to: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  event_id?: string;
}
