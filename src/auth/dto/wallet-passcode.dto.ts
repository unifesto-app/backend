import { IsString, IsEmail, MinLength, MaxLength, Matches } from 'class-validator';

export class RequestOtpDto {
  @IsEmail()
  email: string;
}

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(6)
  @Matches(/^\d{6}$/, { message: 'OTP must be 6 digits' })
  otp: string;
}

export class SetWalletPasscodeDto {
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  @Matches(/^\d{4,6}$/, { message: 'Passcode must be 4-6 digits' })
  passcode: string;

  @IsString()
  otp_token: string;
}

export class VerifyWalletPasscodeDto {
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  @Matches(/^\d{4,6}$/, { message: 'Passcode must be 4-6 digits' })
  passcode: string;
}
