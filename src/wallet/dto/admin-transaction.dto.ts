import { IsString, IsInt, Min, IsOptional, IsIn } from 'class-validator';

export class AdminCreateTransactionDto {
  @IsInt()
  @Min(1)
  amount: number;

  @IsString()
  @IsIn(['earned', 'spent', 'refund', 'referral_bonus', 'event_reward', 'purchase', 'admin_adjustment'])
  type: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
