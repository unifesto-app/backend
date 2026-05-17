import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { SupabaseService } from '../common/database/supabase.service';
import type {
  Profile,
  RequestUser,
  UserPreferences,
} from './interfaces/user.interface';
import { UserRole } from './interfaces/user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import {
  RequestOtpDto,
  VerifyOtpDto,
  SetWalletPasscodeDto,
  VerifyWalletPasscodeDto,
} from './dto/wallet-passcode.dto';

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

            if (
              authUser?.user &&
              !authUser.user.phone &&
              existingProfile.phone
            ) {
              await this.supabaseService
                .getClient()
                .auth.admin.updateUserById(user.sub, {
                  phone: existingProfile.phone,
                });
              this.logger.debug(
                `Synced existing phone to auth.users for user: ${user.sub}`,
              );
            }
          } catch (syncError) {
            this.logger.warn(
              `Failed to sync existing phone: ${syncError.message}`,
            );
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
   * Check if username is available
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase().trim())
        .maybeSingle();

      if (error) {
        this.logger.error(`Error checking username: ${error.message}`);
        throw new InternalServerErrorException('Failed to check username availability');
      }

      // If data exists, username is taken
      return !data;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error('Unexpected error checking username', error);
      throw new InternalServerErrorException('Failed to check username availability');
    }
  }

  /**
   * Check if email exists
   */
  async checkEmailExistence(email: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (error) {
        this.logger.error(`Error checking email: ${error.message}`);
        throw new InternalServerErrorException('Failed to check email');
      }

      return !!data;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error('Unexpected error checking email', error);
      throw new InternalServerErrorException('Failed to check email');
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
      this.logger.error(
        `Unexpected error in syncPhoneToAuthUsers: ${error.message}`,
      );
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
      this.logger.error(
        `Unexpected error in bulkSyncPhonesToAuthUsers: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to bulk sync phone numbers',
      );
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
      this.logger.error(
        `Unexpected error in updatePreferences: ${error.message}`,
      );
      throw new InternalServerErrorException('Failed to update preferences');
    }
  }

  /**
   * Get user preferences
   */
  async getPreferences(userId: string): Promise<UserPreferences> {
    try {
      const profile = await this.getProfile(userId);
      return (
        profile.preferences || {
          push_notifications: true,
          email_notifications: true,
          event_reminders: true,
          marketing_emails: false,
        }
      );
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
   * Request OTP for wallet passcode change
   * Generates a 6-digit OTP and sends it via Resend email
   */
  async requestWalletOtp(userId: string, email: string): Promise<{ token: string }> {
    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in database
      const { error } = await this.supabaseService
        .getClient()
        .from('wallet_otps')
        .insert({
          user_id: userId,
          email,
          otp,
          token,
          expires_at: expiresAt.toISOString(),
          used: false,
        });

      if (error) {
        this.logger.error(`Error storing OTP: ${error.message}`);
        throw new InternalServerErrorException('Failed to generate OTP');
      }

      // Send OTP via Resend email
      await this.sendOtpEmail(email, otp);

      this.logger.log(`OTP generated for user: ${userId}`);
      return { token };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Unexpected error in requestWalletOtp: ${error.message}`);
      throw new InternalServerErrorException('Failed to request OTP');
    }
  }

  /**
   * Send OTP via Resend email service
   */
  private async sendOtpEmail(email: string, otp: string): Promise<void> {
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      const emailFrom = process.env.EMAIL_FROM || 'Unifesto <noreply@unifesto.app>';

      if (!resendApiKey) {
        this.logger.warn('Resend API key not configured');
        // For development, log the OTP
        this.logger.log(`OTP for ${email}: ${otp}`);
        return;
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [email],
          subject: 'Your Wallet Passcode OTP - Unifesto',
          html: `
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Wallet Passcode OTP - Unifesto</title>
              </head>
              <body style="margin:0; padding:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="border-radius:16px; border:1px solid #e5e7eb; overflow:hidden; background:#ffffff;">
                        <!-- Header -->
                        <tr>
                          <td style="background:linear-gradient(135deg,#3491ff 0%,#0062ff 100%); padding:40px; text-align:center;">
                            <h1 style="margin:0; font-size:32px; font-weight:800; color:#000000;">Pocket</h1>
                            <p style="margin:8px 0 0 0; font-size:14px; color:#000000; opacity:0.8;">by Unifesto</p>
                          </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                          <td style="padding:40px; color:#111111;">
                            <h2 style="margin:0 0 16px 0; font-size:24px; font-weight:700;">Wallet Passcode Verification</h2>
                            <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#555555;">
                              Enter this code to verify your wallet passcode change:
                            </p>
                            <!-- OTP Display -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td align="center" style="padding:0 0 24px 0;">
                                  <div style="display:inline-block; background:linear-gradient(135deg,#3491ff 0%,#0062ff 100%); color:#000000; padding:20px 40px; border-radius:12px; font-size:36px; font-weight:800; letter-spacing:8px; font-family:'Courier New', monospace;">
                                    ${otp}
                                  </div>
                                </td>
                              </tr>
                            </table>
                            <p style="margin:0 0 12px 0; font-size:13px; color:#777777;">
                              <strong>This code expires in 10 minutes.</strong>
                            </p>
                            <p style="margin:0; font-size:12px; color:#777777;">
                              If you didn't request this, ignore this email.
                            </p>
                          </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                          <td style="padding:24px; text-align:center; border-top:1px solid #eeeeee;">
                            <p style="margin:0 0 8px 0; font-size:12px; color:#777777;">support@unifesto.app</p>
                            <p style="margin:0; font-size:12px; color:#777777;">© ${new Date().getFullYear()} Unifesto Private Limited</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
          `,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.logger.error(`Resend email error: ${JSON.stringify(errorData)}`);
        // Don't throw - log OTP for development
        this.logger.log(`OTP for ${email}: ${otp}`);
      } else {
        this.logger.log(`OTP email sent to: ${email}`);
      }
    } catch (error) {
      this.logger.error(`Error sending OTP email: ${error.message}`);
      // Don't throw - log OTP for development
      this.logger.log(`OTP for ${email}: ${otp}`);
    }
  }

  /**
   * Verify OTP for wallet passcode change
   */
  async verifyWalletOtp(userId: string, email: string, otp: string): Promise<{ token: string }> {
    try {
      // Get OTP from database
      const { data: otpRecord, error } = await this.supabaseService
        .getClient()
        .from('wallet_otps')
        .select('*')
        .eq('user_id', userId)
        .eq('email', email)
        .eq('otp', otp)
        .eq('used', false)
        .single();

      if (error || !otpRecord) {
        throw new UnauthorizedException('Invalid OTP');
      }

      // Check if OTP is expired
      if (new Date(otpRecord.expires_at) < new Date()) {
        throw new UnauthorizedException('OTP has expired');
      }

      // Mark OTP as used
      await this.supabaseService
        .getClient()
        .from('wallet_otps')
        .update({ used: true })
        .eq('id', otpRecord.id);

      this.logger.log(`OTP verified for user: ${userId}`);
      return { token: otpRecord.token };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Unexpected error in verifyWalletOtp: ${error.message}`);
      throw new InternalServerErrorException('Failed to verify OTP');
    }
  }

  /**
   * Set wallet passcode
   */
  async setWalletPasscode(
    userId: string,
    passcode: string,
    otpToken: string,
  ): Promise<void> {
    try {
      // Verify OTP token is valid and not used
      const { data: otpRecord, error: otpError } = await this.supabaseService
        .getClient()
        .from('wallet_otps')
        .select('*')
        .eq('user_id', userId)
        .eq('token', otpToken)
        .eq('used', true)
        .single();

      if (otpError || !otpRecord) {
        throw new UnauthorizedException('Invalid or expired OTP token');
      }

      // Check if OTP token was used recently (within 5 minutes)
      const tokenAge = Date.now() - new Date(otpRecord.updated_at).getTime();
      if (tokenAge > 5 * 60 * 1000) {
        throw new UnauthorizedException('OTP token has expired');
      }

      // Hash the passcode
      const hashedPasscode = await bcrypt.hash(passcode, 10);

      // Store hashed passcode in profile
      const { error } = await this.supabaseService
        .getClient()
        .from('profiles')
        .update({
          wallet_passcode: hashedPasscode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        this.logger.error(`Error setting wallet passcode: ${error.message}`);
        throw new InternalServerErrorException('Failed to set wallet passcode');
      }

      this.logger.log(`Wallet passcode set for user: ${userId}`);
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Unexpected error in setWalletPasscode: ${error.message}`);
      throw new InternalServerErrorException('Failed to set wallet passcode');
    }
  }

  /**
   * Verify wallet passcode
   */
  async verifyWalletPasscode(userId: string, passcode: string): Promise<boolean> {
    try {
      // Get hashed passcode from profile
      const { data: profile, error } = await this.supabaseService
        .getClient()
        .from('profiles')
        .select('wallet_passcode')
        .eq('id', userId)
        .single();

      if (error || !profile || !profile.wallet_passcode) {
        throw new NotFoundException('Wallet passcode not set');
      }

      // Verify passcode
      const isValid = await bcrypt.compare(passcode, profile.wallet_passcode);

      if (!isValid) {
        throw new UnauthorizedException('Invalid passcode');
      }

      this.logger.log(`Wallet passcode verified for user: ${userId}`);
      return true;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error(`Unexpected error in verifyWalletPasscode: ${error.message}`);
      throw new InternalServerErrorException('Failed to verify wallet passcode');
    }
  }

  /**
   * Check if user has wallet passcode set
   */
  async hasWalletPasscode(userId: string): Promise<boolean> {
    try {
      const { data: profile, error } = await this.supabaseService
        .getClient()
        .from('profiles')
        .select('wallet_passcode')
        .eq('id', userId)
        .single();

      if (error) {
        return false;
      }

      return !!profile?.wallet_passcode;
    } catch (error) {
      this.logger.error(`Error checking wallet passcode: ${error.message}`);
      return false;
    }
  }
}
