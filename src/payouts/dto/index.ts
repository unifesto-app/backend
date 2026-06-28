import { IsString, IsOptional, IsIn, IsUUID, IsBoolean, IsNumber, Min, Max, IsEnum } from 'class-validator';

export class AddBankAccountDto {
  @IsString()
  accountHolderName: string;

  @IsString()
  accountNumber: string;

  @IsString()
  ifscCode: string;

  @IsString()
  bankName: string;

  @IsOptional()
  @IsIn(['savings', 'current'])
  accountType?: string;

  @IsOptional()
  @IsString()
  upiId?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreatePayoutDto {
  @IsUUID()
  eventId: string;

  @IsUUID()
  bankAccountId: string;

  @IsEnum(['T2', 'INSTANT'])
  type: 'T2' | 'INSTANT';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  platformFeePercent?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBankAccountStatusDto {
  @IsEnum(['VERIFIED', 'REJECTED'])
  status: 'VERIFIED' | 'REJECTED';

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
