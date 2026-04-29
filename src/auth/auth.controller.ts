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
import { Request } from 'express';
import { AuthService } from './auth.service';
import { AvatarService } from './avatar.service';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { RequestUser } from './interfaces/user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { RegisterDeviceDto, UpdateDeviceDto } from './dto/register-device.dto';

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
   * POST /auth/devices
   * Register or update a device
   */
  @Post('devices')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SupabaseAuthGuard)
  async registerDevice(
    @CurrentUser() user: RequestUser,
    @Body() deviceDto: RegisterDeviceDto,
    @Req() req: Request,
  ) {
    this.logger.log(`Registering device for user: ${user.sub}`);

    // Add IP address from request if not provided
    if (!deviceDto.ip_address) {
      deviceDto.ip_address = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    }

    // Add user agent if not provided
    if (!deviceDto.user_agent) {
      deviceDto.user_agent = req.headers['user-agent'] || 'unknown';
    }

    const device = await this.authService.registerDevice(user.sub, deviceDto);

    // Update last login
    await this.authService.updateLastLogin(user.sub);

    return {
      message: 'Device registered successfully',
      device,
    };
  }

  /**
   * GET /auth/devices
   * Get all devices for current user
   */
  @Get('devices')
  @UseGuards(SupabaseAuthGuard)
  async getDevices(@CurrentUser() user: RequestUser) {
    this.logger.debug(`Fetching devices for user: ${user.sub}`);

    const devices = await this.authService.getUserDevices(user.sub);

    return {
      devices,
      total: devices.length,
    };
  }

  /**
   * PATCH /auth/devices/:deviceId
   * Update a device
   */
  @Patch('devices/:deviceId')
  @UseGuards(SupabaseAuthGuard)
  async updateDevice(
    @CurrentUser() user: RequestUser,
    @Param('deviceId') deviceId: string,
    @Body() updateDto: UpdateDeviceDto,
  ) {
    this.logger.log(`Updating device ${deviceId} for user: ${user.sub}`);

    const device = await this.authService.updateDevice(
      user.sub,
      deviceId,
      updateDto,
    );

    return {
      message: 'Device updated successfully',
      device,
    };
  }

  /**
   * DELETE /auth/devices/:deviceId
   * Delete a device (logout from device)
   */
  @Delete('devices/:deviceId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SupabaseAuthGuard)
  async deleteDevice(
    @CurrentUser() user: RequestUser,
    @Param('deviceId') deviceId: string,
  ) {
    this.logger.log(`Deleting device ${deviceId} for user: ${user.sub}`);

    await this.authService.deleteDevice(user.sub, deviceId);

    return {
      message: 'Device removed successfully',
    };
  }

  /**
   * POST /auth/devices/logout-others
   * Logout from all devices except current
   */
  @Post('devices/logout-others')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SupabaseAuthGuard)
  async logoutOtherDevices(
    @CurrentUser() user: RequestUser,
    @Body('current_device_id') currentDeviceId: string,
  ) {
    this.logger.log(`Logging out other devices for user: ${user.sub}`);

    if (!currentDeviceId) {
      throw new BadRequestException('current_device_id is required');
    }

    const count = await this.authService.logoutOtherDevices(
      user.sub,
      currentDeviceId,
    );

    return {
      message: `Logged out from ${count} device(s)`,
      count,
    };
  }
}
