import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { BillingCycle, OrgPlan } from '@prisma/client';

export class UpgradeSubscriptionDto {
  @ApiProperty({ enum: OrgPlan, example: OrgPlan.GROWTH })
  @IsEnum(OrgPlan)
  plan: OrgPlan;

  @ApiProperty({ enum: BillingCycle, example: BillingCycle.MONTHLY })
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;
}

export class VerifyUpgradeDto {
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

export class AdminUpdateSubscriptionDto {
  @ApiPropertyOptional({ enum: OrgPlan })
  @IsOptional()
  @IsEnum(OrgPlan)
  plan?: OrgPlan;

  @ApiPropertyOptional({ example: 'Manual upgrade by admin' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SubscriptionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: OrgPlan })
  plan: OrgPlan;

  @ApiProperty({ enum: BillingCycle })
  billingCycle: BillingCycle;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  startedAt: Date;

  @ApiPropertyOptional()
  expiresAt?: Date;

  @ApiPropertyOptional()
  nextPaymentAt?: Date;

  @ApiProperty()
  eventsThisMonth: number;

  @ApiProperty()
  usageResetAt: Date;
}

export class SubscriptionUsageDto {
  @ApiProperty()
  spacesCount: number;

  @ApiProperty()
  eventsThisMonth: number;

  @ApiProperty()
  plan: OrgPlan;

  @ApiProperty()
  limits: {
    spaces: number | null;
    eventsPerMonth: number | null;
    attendeesPerEvent: number | null;
    ticketTypes: number | null;
    coOrganisers: number | null;
  };
}
