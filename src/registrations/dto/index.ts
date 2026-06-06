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
