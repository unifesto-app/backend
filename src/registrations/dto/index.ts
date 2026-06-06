import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  Min,
  IsOptional,
  IsObject,
  IsUUID,
  Max,
} from 'class-validator';

export class RegisterForEventDto {
  @ApiPropertyOptional({ example: 'ticket-type-uuid' })
  @IsOptional()
  @IsUUID()
  ticketTypeId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  quantity?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  coinsToUse?: number;

  @ApiPropertyOptional({ example: { dietaryPreference: 'Vegetarian' } })
  @IsOptional()
  @IsObject()
  formResponses?: Record<string, any>;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'ticket-type-uuid' })
  @IsUUID()
  ticketTypeId: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(10)
  quantity: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  coinsToUse?: number;

  @ApiPropertyOptional({ example: { dietaryPreference: 'Vegetarian' } })
  @IsOptional()
  @IsObject()
  formResponses?: Record<string, any>;
}

export class VerifyPaymentDto {
  @ApiProperty({ example: 'order_abc123' })
  @IsString()
  razorpayOrderId: string;

  @ApiProperty({ example: 'pay_xyz789' })
  @IsString()
  razorpayPaymentId: string;

  @ApiProperty({ example: 'signature_hash' })
  @IsString()
  razorpaySignature: string;

  @ApiProperty({ example: 'registration-uuid' })
  @IsUUID()
  registrationId: string;
}

export class VerifyRegistrationDto {
  @ApiProperty({ example: 'order_abc123' })
  @IsString()
  orderId: string;

  @ApiProperty({ example: 'pay_xyz789' })
  @IsString()
  paymentId: string;

  @ApiProperty({ example: 'signature_hash' })
  @IsString()
  signature: string;
}

export class OrderResponseDto {
  @ApiProperty()
  registrationId: string;

  @ApiProperty()
  razorpayOrderId: string;

  @ApiProperty()
  razorpayKeyId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  breakdown: {
    baseAmount: number;
    processingFee: number;
    coinsUsed: number;
    coinValueINR: number;
    razorpayAmount: number;
    totalAmount: number;
  };
}

export class RegistrationResponseDto {
  @ApiProperty()
  registrationId: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  qrCode?: string;

  @ApiProperty()
  tickets?: any[];
}
