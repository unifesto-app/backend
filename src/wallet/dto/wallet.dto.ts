import { IsNotEmpty, IsString, IsInt, Min, IsOptional, IsIn } from 'class-validator';

export class AddCoinsDto {
  @IsInt()
  @Min(1)
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsIn(['earned', 'event_reward', 'referral_bonus'])
  type: string;
}

export class SpendCoinsDto {
  @IsInt()
  @Min(1)
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  @IsIn(['spent', 'purchase'])
  type?: string;
}

export class ApplyReferralDto {
  @IsString()
  @IsNotEmpty()
  referralCode: string;
}

export class ApplyRedeemCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class CreateRedeemCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsIn(['promotional', 'gift', 'event', 'partner'])
  type: string;

  @IsInt()
  @Min(1)
  coinAmount: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  maxUses?: number;

  @IsString()
  @IsOptional()
  expiresAt?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateSystemSettingDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsNotEmpty()
  value: any;

  @IsString()
  @IsOptional()
  description?: string;
}
