import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  GoogleLoginDto,
  AppleLoginDto,
  EmailLoginDto,
  SendMobileOtpDto,
  VerifyMobileDto,
  AuthResponseDto,
} from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login with Google
   * POST /auth/google
   */
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async loginWithGoogle(
    @Body() dto: GoogleLoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.loginWithGoogle(dto);
  }

  /**
   * Login with Apple
   * POST /auth/apple
   */
  @Post('apple')
  @HttpCode(HttpStatus.OK)
  async loginWithApple(@Body() dto: AppleLoginDto): Promise<AuthResponseDto> {
    return this.authService.loginWithApple(dto);
  }

  /**
   * Send Email OTP
   * POST /auth/email
   */
  @Post('cognito')
  @ApiOperation({ summary: 'Login with Cognito ID token (Google/Apple via Cognito)' })
  @ApiResponse({ status: 200 })
  async loginWithCognito(@Body() body: { idToken: string }): Promise<AuthResponseDto> {
    return this.authService.loginWithCognito(body.idToken);
  }

  @Post('email')
  @HttpCode(HttpStatus.OK)
  async loginWithEmail(
    @Body() dto: EmailLoginDto,
  ): Promise<{ message: string }> {
    return this.authService.loginWithEmail(dto);
  }

  /**
   * Verify Email OTP
   * POST /auth/email/verify
   */
  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  async verifyEmailOtp(
    @Body() body: { email: string; otp: string },
  ): Promise<AuthResponseDto> {
    return this.authService.verifyEmailOtp(body.email, body.otp);
  }

  /**
   * Send Mobile OTP
   * POST /auth/mobile/send-otp
   */
  @Post('mobile/send-otp')
  @HttpCode(HttpStatus.OK)
  async sendMobileOtp(
    @Body() dto: SendMobileOtpDto,
  ): Promise<{ message: string }> {
    return this.authService.sendMobileOtp(dto);
  }

  /**
   * Verify Mobile Number
   * POST /auth/verify-mobile
   */
  @Post('verify-mobile')
  @HttpCode(HttpStatus.OK)
  async verifyMobile(@Body() dto: VerifyMobileDto): Promise<AuthResponseDto> {
    return this.authService.verifyMobile(dto);
  }

  /**
   * Get Current Session
   * GET /auth/session
   * Skip throttling for session validation endpoint
   */
  @Get('session')
  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  async getSession(@Request() req) {
    return {
      user: req.user,
    };
  }

  /**
   * Logout
   * POST /auth/logout
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req): Promise<{ message: string }> {
    return this.authService.logout(req.user.id);
  }
}
