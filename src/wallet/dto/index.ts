import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  Min,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsArray,
  IsUUID,
} from 'class-validator';
import { CoinSource, TransactionType } from '@prisma/client';

export class RedeemCodeDto {
  @ApiProperty({ example: 'WELCOME2024' })
  @IsString()
  code: string;
}

export class AdminGrantCoinsDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  coins: number;

  @ApiPropertyOptional({ example: 'Event participation reward' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateRedeemCodeDto {
  @ApiProperty({ example: 'WELCOME2024' })
  @IsString()
  code: string;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(1)
  coins: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalUses?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  perUserLimit?: number;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  restrictToUsers?: string[];

  @ApiPropertyOptional({ example: 'Welcome bonus for new users' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateRedeemCodeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  totalUses?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class PartnerRedeemDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(1)
  coins: number;

  @ApiProperty({ example: 'partner-txn-123' })
  @IsString()
  partnerTxnId: string;

  @ApiPropertyOptional({ example: 'Redeemed from partner platform' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreatePartnerDto {
  @ApiProperty({ example: 'PartnerCo' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'partnerco' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ example: 'Partner description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://logo.url' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://partner.com' })
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxCoinsPerTxn?: number;
}

export class UpdatePartnerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxCoinsPerTxn?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class WalletResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  balance: number;

  @ApiProperty()
  totalEarned: number;

  @ApiProperty()
  totalSpent: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class WalletTransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: TransactionType })
  type: TransactionType;

  @ApiProperty({ enum: CoinSource })
  source: CoinSource;

  @ApiProperty()
  coins: number;

  @ApiProperty()
  balanceBefore: number;

  @ApiProperty()
  balanceAfter: number;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  note?: string;

  @ApiProperty()
  createdAt: Date;
}
