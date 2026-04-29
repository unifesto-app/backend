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
