import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { UpdateProfileDto } from './dto';
import { User } from '@prisma/client';
import { UserProfileDto } from '../auth/dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly supabase: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL')!;
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY')!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get current user profile
   */
  async getMe(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return UserProfileDto.fromUser(user);
  }

  /**
   * Update current user profile
   */
  async updateMe(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    // Check if username is being updated and is available
    if (dto.username) {
      const isAvailable = await this.isUsernameAvailable(dto.username, userId);
      if (!isAvailable) {
        throw new ConflictException('Username is already taken');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        username: dto.username,
        fullName: dto.fullName,
        bio: dto.bio,
        linkedinUrl: dto.linkedinUrl,
        instagramUrl: dto.instagramUrl,
        githubUrl: dto.githubUrl,
        websiteUrl: dto.websiteUrl,
      },
    });

    return UserProfileDto.fromUser(user);
  }

  /**
   * Mark user as onboarded
   */
  async completeOnboarding(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isOnboarded: true },
    });

    return UserProfileDto.fromUser(user);
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return UserProfileDto.fromUser(user);
  }

  /**
   * Check if username is available
   */
  async checkUsernameAvailability(
    username: string,
  ): Promise<{ available: boolean }> {
    const available = await this.isUsernameAvailable(username);
    return { available };
  }

  /**
   * Helper: Check if username is available
   */
  private async isUsernameAvailable(
    username: string,
    excludeUserId?: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return true;
    }

    // If excluding a user ID, check if it's the same user
    if (excludeUserId && user.id === excludeUserId) {
      return true;
    }

    return false;
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ avatarUrl: string }> {
    const fileName = `${userId}-${Date.now()}.${file.mimetype.split('/')[1]}`;
    const filePath = `avatars/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await this.supabase.storage
      .from('user-avatars')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      this.logger.error('Failed to upload avatar', uploadError);
      throw new ConflictException('Failed to upload avatar');
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = this.supabase.storage.from('user-avatars').getPublicUrl(filePath);

    // Update user avatar URL
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: publicUrl },
    });

    return { avatarUrl: publicUrl };
  }

  /**
   * Get user's linked accounts (identities)
   */
  async getUserIdentities(userId: string) {
    const identities = await this.prisma.userIdentity.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        email: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return identities;
  }
}
