import { IsString, IsEmail, IsArray, IsNumber, IsObject, IsOptional, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class AttendeeDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  mobile: string;

  @IsString()
  gender: string;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}

export class CreateRegistrationDto {
  @IsString()
  eventId: string;

  @IsString()
  ticketId: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  quantity: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendeeDto)
  attendees: AttendeeDto[];

  @IsString()
  buyerName: string;

  @IsEmail()
  buyerEmail: string;

  @IsString()
  buyerPhone: string;
}

export class VerifyPaymentDto {
  @IsArray()
  @IsString({ each: true })
  registrationIds: string[];

  @IsString()
  razorpayOrderId: string;

  @IsString()
  razorpayPaymentId: string;

  @IsString()
  razorpaySignature: string;
}
