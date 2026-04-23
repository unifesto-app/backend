import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { RequestUser } from './interfaces/user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

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
}
