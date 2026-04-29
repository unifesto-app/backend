import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';
import type { Profile, RequestUser, UserDevice, UserPreferences } from './interfaces/user.interface';
import { UserRole } from './interfaces/user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { RegisterDeviceDto, UpdateDeviceDto } from './dto/register-device.dto';

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

      // Convert username to lowercase if provided
      if (updateDto.username) {
        updateDto.username = updateDto.username.toLowerCase().trim();
        
        // Check for uniqueness
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

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string,
    preferencesDto: UpdatePreferencesDto,
  ): Promise<UserPreferences> {
    try {
      // Get current profile to merge preferences
      const profile = await this.getProfile(userId);
      const currentPreferences = profile.preferences || {};

      // Merge new preferences with existing ones
      const updatedPreferences = {
        ...currentPreferences,
        ...preferencesDto,
      };

      const { data, error } = await this.supabaseService
        .getClient()
        .from('profiles')
        .update({
          preferences: updatedPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select('preferences')
        .single();

      if (error) {
        this.logger.error(`Error updating preferences: ${error.message}`);
        throw new InternalServerErrorException('Failed to update preferences');
      }

      this.logger.log(`Preferences updated for user: ${userId}`);
      return data.preferences as UserPreferences;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Unexpected error in updatePreferences: ${error.message}`);
      throw new InternalServerErrorException('Failed to update preferences');
    }
  }

  /**
   * Get user preferences
   */
  async getPreferences(userId: string): Promise<UserPreferences> {
    try {
      const profile = await this.getProfile(userId);
      return profile.preferences || {
        push_notifications: true,
        email_notifications: true,
        event_reminders: true,
        marketing_emails: false,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Unexpected error in getPreferences: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch preferences');
    }
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      const { error } = await this.supabaseService
        .getClient()
        .from('profiles')
        .update({
          last_login: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        this.logger.warn(`Failed to update last_login: ${error.message}`);
        // Don't throw - this is not critical
      } else {
        this.logger.debug(`Last login updated for user: ${userId}`);
      }
    } catch (error) {
      this.logger.warn(`Error updating last_login: ${error.message}`);
      // Don't throw - this is not critical
    }
  }

  /**
   * Register or update a device
   */
  async registerDevice(
    userId: string,
    deviceDto: RegisterDeviceDto,
  ): Promise<UserDevice> {
    try {
      // Check if device already exists by fingerprint
      const { data: existingDevice } = await this.supabaseService
        .getClient()
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .eq('device_fingerprint', deviceDto.device_fingerprint)
        .single();

      if (existingDevice) {
        // Update existing device
        const { data, error } = await this.supabaseService
          .getClient()
          .from('user_devices')
          .update({
            device_name: deviceDto.device_name,
            device_type: deviceDto.device_type,
            device_model: deviceDto.device_model,
            os_version: deviceDto.os_version,
            app_version: deviceDto.app_version,
            device_token: deviceDto.device_token,
            ip_address: deviceDto.ip_address,
            user_agent: deviceDto.user_agent,
            last_active: new Date().toISOString(),
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingDevice.id)
          .select()
          .single();

        if (error) {
          this.logger.error(`Error updating device: ${error.message}`);
          throw new InternalServerErrorException('Failed to update device');
        }

        this.logger.log(`Device updated for user: ${userId}`);
        return data as UserDevice;
      }

      // Create new device
      const { data, error } = await this.supabaseService
        .getClient()
        .from('user_devices')
        .insert({
          user_id: userId,
          ...deviceDto,
          last_active: new Date().toISOString(),
          first_seen: new Date().toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`Error registering device: ${error.message}`);
        throw new InternalServerErrorException('Failed to register device');
      }

      this.logger.log(`Device registered for user: ${userId}`);
      return data as UserDevice;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Unexpected error in registerDevice: ${error.message}`);
      throw new InternalServerErrorException('Failed to register device');
    }
  }

  /**
   * Get all devices for a user
   */
  async getUserDevices(userId: string): Promise<UserDevice[]> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_active', { ascending: false });

      if (error) {
        this.logger.error(`Error fetching devices: ${error.message}`);
        throw new InternalServerErrorException('Failed to fetch devices');
      }

      return (data || []) as UserDevice[];
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Unexpected error in getUserDevices: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch devices');
    }
  }

  /**
   * Update device
   */
  async updateDevice(
    userId: string,
    deviceId: string,
    updateDto: UpdateDeviceDto,
  ): Promise<UserDevice> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('user_devices')
        .update({
          ...updateDto,
          updated_at: new Date().toISOString(),
        })
        .eq('id', deviceId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundException('Device not found');
        }
        this.logger.error(`Error updating device: ${error.message}`);
        throw new InternalServerErrorException('Failed to update device');
      }

      this.logger.log(`Device ${deviceId} updated for user: ${userId}`);
      return data as UserDevice;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Unexpected error in updateDevice: ${error.message}`);
      throw new InternalServerErrorException('Failed to update device');
    }
  }

  /**
   * Delete device (logout from device)
   * Note: This marks the device as inactive but doesn't invalidate the Supabase session
   * The user will need to manually log out on that device or the session will expire naturally
   */
  async deleteDevice(userId: string, deviceId: string): Promise<void> {
    try {
      // Mark device as inactive instead of deleting
      // This is because we can't invalidate Supabase sessions from the backend
      const { error } = await this.supabaseService
        .getClient()
        .from('user_devices')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', deviceId)
        .eq('user_id', userId);

      if (error) {
        this.logger.error(`Error marking device as inactive: ${error.message}`);
        throw new InternalServerErrorException('Failed to remove device');
      }

      this.logger.log(`Device ${deviceId} marked as inactive for user: ${userId}`);
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Unexpected error in deleteDevice: ${error.message}`);
      throw new InternalServerErrorException('Failed to remove device');
    }
  }

  /**
   * Logout from all devices except current
   * Note: This marks devices as inactive but doesn't invalidate Supabase sessions
   */
  async logoutOtherDevices(
    userId: string,
    currentDeviceId: string,
  ): Promise<number> {
    try {
      // First, log what devices exist
      const { data: allDevices } = await this.supabaseService
        .getClient()
        .from('user_devices')
        .select('id, device_name, device_fingerprint, is_active')
        .eq('user_id', userId);

      this.logger.log(`All devices for user ${userId}:`, JSON.stringify(allDevices));
      this.logger.log(`Current device ID: ${currentDeviceId}`);
      this.logger.log(`Devices to logout: ${allDevices?.filter(d => d.id !== currentDeviceId && d.is_active).length}`);

      // Mark other devices as inactive instead of deleting
      const { data, error } = await this.supabaseService
        .getClient()
        .from('user_devices')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .neq('id', currentDeviceId)
        .eq('is_active', true)
        .select();

      if (error) {
        this.logger.error(`Error logging out other devices: ${error.message}`);
        throw new InternalServerErrorException('Failed to logout other devices');
      }

      const count = data?.length || 0;
      this.logger.log(`Marked ${count} devices as inactive for user: ${userId}`);
      this.logger.log(`Updated devices:`, JSON.stringify(data));
      return count;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Unexpected error in logoutOtherDevices: ${error.message}`);
      throw new InternalServerErrorException('Failed to logout other devices');
    }
  }
}
