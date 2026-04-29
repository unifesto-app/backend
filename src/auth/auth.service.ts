import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';
import type { Profile, RequestUser } from './interfaces/user.interface';
import { UserRole } from './interfaces/user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<Profile> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundException('Profile not found');
        }
        this.logger.error(`Error fetching profile: ${error.message}`);
        throw new InternalServerErrorException('Failed to fetch profile');
      }

      return data as Profile;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Unexpected error in getProfile: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch profile');
    }
  }

  /**
   * Create profile if it doesn't exist (sync operation)
   */
  async createProfileIfNotExists(user: RequestUser): Promise<Profile> {
    try {
      // Check if profile exists
      const { data: existingProfile } = await this.supabaseService
        .getClient()
        .from('profiles')
        .select('*')
        .eq('id', user.sub)
        .single();

      if (existingProfile) {
        this.logger.debug(`Profile already exists for user: ${user.sub}`);
        
        // Sync phone to auth.users if profile has phone but auth.users doesn't
        if (existingProfile.phone) {
          try {
            const { data: authUser } = await this.supabaseService
              .getClient()
              .auth.admin.getUserById(user.sub);

            if (authUser?.user && !authUser.user.phone && existingProfile.phone) {
              await this.supabaseService
                .getClient()
                .auth.admin.updateUserById(user.sub, {
                  phone: existingProfile.phone,
                });
              this.logger.debug(`Synced existing phone to auth.users for user: ${user.sub}`);
            }
          } catch (syncError) {
            this.logger.warn(`Failed to sync existing phone: ${syncError.message}`);
          }
        }
        
        return existingProfile as Profile;
      }

      // Create new profile
      const newProfile = {
        id: user.sub,
        email: user.email,
        role: UserRole.ATTENDEE,
        is_verified: false,
        is_active: true,
        is_banned: false,
      };

      const { data, error } = await this.supabaseService
        .getClient()
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation
        if (error.code === '23505') {
          this.logger.warn(
            `Profile creation race condition for user: ${user.sub}`,
          );
          // Fetch the profile that was created by another request
          return this.getProfile(user.sub);
        }
        this.logger.error(`Error creating profile: ${error.message}`);
        throw new InternalServerErrorException('Failed to create profile');
      }

      this.logger.log(`Profile created for user: ${user.sub}`);
      return data as Profile;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(
        `Unexpected error in createProfileIfNotExists: ${error.message}`,
      );
      throw new InternalServerErrorException('Failed to sync profile');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateDto: UpdateProfileDto,
  ): Promise<Profile> {
    try {
      // Check if profile exists
      await this.getProfile(userId);

      // If username is being updated, check for uniqueness
      if (updateDto.username) {
        const { data: existingUsername } = await this.supabaseService
          .getClient()
          .from('profiles')
          .select('id')
          .eq('username', updateDto.username)
          .neq('id', userId)
          .single();

        if (existingUsername) {
          throw new ConflictException('Username already taken');
        }
      }

      // Update profile in profiles table
      const { data, error } = await this.supabaseService
        .getClient()
        .from('profiles')
        .update({
          ...updateDto,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error updating profile: ${error.message}`);
        throw new InternalServerErrorException('Failed to update profile');
      }

      // Sync phone number to auth.users table if phone is being updated
      if (updateDto.phone !== undefined) {
        try {
          const { error: authError } = await this.supabaseService
            .getClient()
            .auth.admin.updateUserById(userId, {
              phone: updateDto.phone || undefined,
            });

          if (authError) {
            this.logger.warn(
              `Failed to sync phone to auth.users: ${authError.message}`,
            );
            // Don't throw error - profile update succeeded, auth sync is secondary
          } else {
            this.logger.debug(`Phone synced to auth.users for user: ${userId}`);
          }
        } catch (syncError) {
          this.logger.warn(
            `Error syncing phone to auth.users: ${syncError.message}`,
          );
          // Continue - profile update succeeded
        }
      }

      this.logger.log(`Profile updated for user: ${userId}`);
      return data as Profile;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Unexpected error in updateProfile: ${error.message}`);
      throw new InternalServerErrorException('Failed to update profile');
    }
  }

  /**
   * Check if user is banned
   */
  async isUserBanned(userId: string): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId);
      return profile.is_banned;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Check if user is active
   */
  async isUserActive(userId: string): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId);
      return profile.is_active && !profile.is_banned;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Sync phone number from profile to auth.users
   * Useful for one-time migration or manual sync
   */
  async syncPhoneToAuthUsers(userId: string): Promise<void> {
    try {
      const profile = await this.getProfile(userId);

      if (!profile.phone) {
        this.logger.debug(`No phone number to sync for user: ${userId}`);
        return;
      }

      const { error } = await this.supabaseService
        .getClient()
        .auth.admin.updateUserById(userId, {
          phone: profile.phone,
        });

      if (error) {
        this.logger.error(
          `Failed to sync phone to auth.users for user ${userId}: ${error.message}`,
        );
        throw new InternalServerErrorException('Failed to sync phone number');
      }

      this.logger.log(`Phone synced to auth.users for user: ${userId}`);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Unexpected error in syncPhoneToAuthUsers: ${error.message}`);
      throw new InternalServerErrorException('Failed to sync phone number');
    }
  }

  /**
   * Bulk sync all phone numbers from profiles to auth.users
   * Use with caution - for migration purposes
   */
  async bulkSyncPhonesToAuthUsers(): Promise<{
    total: number;
    synced: number;
    failed: number;
    errors: string[];
  }> {
    try {
      // Get all profiles with phone numbers
      const { data: profiles, error } = await this.supabaseService
        .getClient()
        .from('profiles')
        .select('id, phone')
        .not('phone', 'is', null);

      if (error) {
        this.logger.error(`Error fetching profiles: ${error.message}`);
        throw new InternalServerErrorException('Failed to fetch profiles');
      }

      const total = profiles?.length || 0;
      let synced = 0;
      let failed = 0;
      const errors: string[] = [];

      this.logger.log(`Starting bulk phone sync for ${total} profiles`);

      for (const profile of profiles || []) {
        try {
          await this.supabaseService
            .getClient()
            .auth.admin.updateUserById(profile.id, {
              phone: profile.phone,
            });
          synced++;
        } catch (syncError) {
          failed++;
          const errorMsg = `User ${profile.id}: ${syncError.message}`;
          errors.push(errorMsg);
          this.logger.warn(`Failed to sync phone for user ${profile.id}`);
        }
      }

      this.logger.log(
        `Bulk phone sync completed: ${synced} synced, ${failed} failed out of ${total}`,
      );

      return { total, synced, failed, errors };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Unexpected error in bulkSyncPhonesToAuthUsers: ${error.message}`);
      throw new InternalServerErrorException('Failed to bulk sync phone numbers');
    }
  }
}
