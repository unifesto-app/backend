import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  Param,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { AvatarService } from './avatar.service';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { RequestUser } from './interfaces/user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import {
  RequestOtpDto,
  VerifyOtpDto,
  SetWalletPasscodeDto,
  VerifyWalletPasscodeDto,
} from './dto/wallet-passcode.dto';
import { RateLimit } from '../common/guards/rate-limit.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly avatarService: AvatarService,
  ) {}

  /**
   * GET /auth/health
   * Health check endpoint (no auth required)
   */
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      supabaseConfigured: !!(
        process.env.SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_ROLE_KEY &&
        process.env.SUPABASE_JWT_SECRET
      ),
      supabaseUrl: process.env.SUPABASE_URL || 'not configured',
    };
  }

  /**
   * GET /auth/me
   * Get current user profile
   */
  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  async getMe(@CurrentUser() user: RequestUser) {
    this.logger.debug(`Fetching profile for user: ${user.sub}`);

    const profile = await this.authService.getProfile(user.sub);

    return {
      id: profile.id,
      email: profile.email,
      profile: {
        name: profile.name,
        username: profile.username,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        phone: profile.phone,
        role: profile.role,
        is_verified: profile.is_verified,
        is_active: profile.is_active,
        preferences: profile.preferences,
        last_login: profile.last_login,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      },
    };
  }

  /**
   * POST /auth/sync
   * Sync user profile (create if not exists)
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SupabaseAuthGuard)
  @RateLimit({ maxRequests: 10, windowMinutes: 5 })
  async syncProfile(@CurrentUser() user: RequestUser) {
    this.logger.log(`Syncing profile for user: ${user.sub}`);

    const profile = await this.authService.createProfileIfNotExists(user);

    return {
      message: 'Profile synced successfully',
      profile: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        username: profile.username,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        phone: profile.phone,
        role: profile.role,
        is_verified: profile.is_verified,
        is_active: profile.is_active,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      },
    };
  }

  /**
   * PATCH /auth/profile
   * Update user profile
   */
  @Patch('profile')
  @UseGuards(SupabaseAuthGuard)
  @RateLimit({ maxRequests: 20, windowMinutes: 5 })
  async updateProfile(
    @CurrentUser() user: RequestUser,
    @Body() updateDto: UpdateProfileDto,
  ) {
    this.logger.log(`Updating profile for user: ${user.sub}`);

    const profile = await this.authService.updateProfile(user.sub, updateDto);

    return {
      message: 'Profile updated successfully',
      profile: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        username: profile.username,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        phone: profile.phone,
        role: profile.role,
        is_verified: profile.is_verified,
        is_active: profile.is_active,
        updated_at: profile.updated_at,
      },
    };
  }

  /**
   * POST /auth/avatar
   * Upload user avatar
   */
  @Post('avatar')
  @UseGuards(SupabaseAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  @RateLimit({ maxRequests: 5, windowMinutes: 10 })
  async uploadAvatar(
    @CurrentUser() user: RequestUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.logger.log(`Uploading avatar for user: ${user.sub}`);

    // Upload avatar and get URL
    const avatarUrl = await this.avatarService.uploadAvatar(user.sub, file);

    // Update profile with new avatar URL
    await this.authService.updateProfile(user.sub, {
      avatar_url: avatarUrl,
    });

    return {
      message: 'Avatar uploaded successfully',
      avatar_url: avatarUrl,
    };
  }

  /**
   * DELETE /auth/avatar
   * Delete user avatar
   */
  @Delete('avatar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SupabaseAuthGuard)
  async deleteAvatar(@CurrentUser() user: RequestUser) {
    this.logger.log(`Deleting avatar for user: ${user.sub}`);

    // Delete avatar files
    await this.avatarService.deleteUserAvatars(user.sub);

    // Update profile to remove avatar URL
    await this.authService.updateProfile(user.sub, {
      avatar_url: null,
    });

    return {
      message: 'Avatar deleted successfully',
    };
  }

  /**
   * POST /auth/sync-phone
   * Sync phone number from profile to auth.users
   */
  @Post('sync-phone')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SupabaseAuthGuard)
  async syncPhone(@CurrentUser() user: RequestUser) {
    this.logger.log(`Syncing phone to auth.users for user: ${user.sub}`);

    await this.authService.syncPhoneToAuthUsers(user.sub);

    return {
      message: 'Phone number synced to auth.users successfully',
    };
  }

  /**
   * POST /auth/bulk-sync-phones
   * Bulk sync all phone numbers from profiles to auth.users
   * Admin only - requires super_admin role
   */
  @Post('bulk-sync-phones')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SupabaseAuthGuard)
  async bulkSyncPhones(@CurrentUser() user: RequestUser) {
    this.logger.log(`Bulk phone sync requested by user: ${user.sub}`);

    // Check if user is super_admin
    const profile = await this.authService.getProfile(user.sub);
    if (profile.role !== 'super_admin') {
      throw new BadRequestException('Only super_admin can perform bulk sync');
    }

    const result = await this.authService.bulkSyncPhonesToAuthUsers();

    return {
      message: 'Bulk phone sync completed',
      ...result,
    };
  }

  /**
   * GET /auth/preferences
   * Get user preferences
   */
  @Get('preferences')
  @UseGuards(SupabaseAuthGuard)
  async getPreferences(@CurrentUser() user: RequestUser) {
    this.logger.debug(`Fetching preferences for user: ${user.sub}`);

    const preferences = await this.authService.getPreferences(user.sub);

    return {
      preferences,
    };
  }

  /**
   * PATCH /auth/preferences
   * Update user preferences
   */
  @Patch('preferences')
  @UseGuards(SupabaseAuthGuard)
  async updatePreferences(
    @CurrentUser() user: RequestUser,
    @Body() preferencesDto: UpdatePreferencesDto,
  ) {
    this.logger.log(`Updating preferences for user: ${user.sub}`);

    const preferences = await this.authService.updatePreferences(
      user.sub,
      preferencesDto,
    );

    return {
      message: 'Preferences updated successfully',
      preferences,
    };
  }

  /**
   * POST /auth/wallet/request-otp
   * Request OTP for wallet passcode change
   */
  @Post('wallet/request-otp')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SupabaseAuthGuard)
  @RateLimit({ maxRequests: 3, windowMinutes: 15 })
  async requestWalletOtp(
    @CurrentUser() user: RequestUser,
    @Body() requestOtpDto: RequestOtpDto,
  ) {
    this.logger.log(`Requesting wallet OTP for user: ${user.sub}`);

    const result = await this.authService.requestWalletOtp(
      user.sub,
      requestOtpDto.email,
    );

    return {
      message: 'OTP sent to your email',
      token: result.token,
    };
  }

  /**
   * POST /auth/wallet/verify-otp
   * Verify OTP for wallet passcode change
   */
  @Post('wallet/verify-otp')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SupabaseAuthGuard)
  @RateLimit({ maxRequests: 5, windowMinutes: 15 })
  async verifyWalletOtp(
    @CurrentUser() user: RequestUser,
    @Body() verifyOtpDto: VerifyOtpDto,
  ) {
    this.logger.log(`Verifying wallet OTP for user: ${user.sub}`);

    const result = await this.authService.verifyWalletOtp(
      user.sub,
      verifyOtpDto.email,
      verifyOtpDto.otp,
    );

    return {
      message: 'OTP verified successfully',
      token: result.token,
    };
  }

  /**
   * POST /auth/wallet/set-passcode
   * Set wallet passcode
   */
  @Post('wallet/set-passcode')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SupabaseAuthGuard)
  async setWalletPasscode(
    @CurrentUser() user: RequestUser,
    @Body() setPasscodeDto: SetWalletPasscodeDto,
  ) {
    this.logger.log(`Setting wallet passcode for user: ${user.sub}`);

    await this.authService.setWalletPasscode(
      user.sub,
      setPasscodeDto.passcode,
      setPasscodeDto.otp_token,
    );

    return {
      message: 'Wallet passcode set successfully',
    };
  }

  /**
   * POST /auth/wallet/verify-passcode
   * Verify wallet passcode
   */
  @Post('wallet/verify-passcode')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SupabaseAuthGuard)
  async verifyWalletPasscode(
    @CurrentUser() user: RequestUser,
    @Body() verifyPasscodeDto: VerifyWalletPasscodeDto,
  ) {
    this.logger.log(`Verifying wallet passcode for user: ${user.sub}`);

    await this.authService.verifyWalletPasscode(
      user.sub,
      verifyPasscodeDto.passcode,
    );

    return {
      message: 'Passcode verified successfully',
      valid: true,
    };
  }

  /**
   * GET /auth/wallet/has-passcode
   * Check if user has wallet passcode set
   */
  @Get('wallet/has-passcode')
  @UseGuards(SupabaseAuthGuard)
  async hasWalletPasscode(@CurrentUser() user: RequestUser) {
    this.logger.debug(`Checking wallet passcode for user: ${user.sub}`);

    const hasPasscode = await this.authService.hasWalletPasscode(user.sub);

    return {
      has_passcode: hasPasscode,
    };
  }
}
