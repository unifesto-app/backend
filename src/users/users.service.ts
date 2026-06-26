import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { UpdateProfileDto } from './dto';
import { User } from '@prisma/client';
import { UserProfileDto } from '../auth/dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Get all users with pagination (ADMIN only)
   */
  async getAllUsers(params: {
    page: number;
    limit: number;
    search?: string;
  }) {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { username: { contains: search, mode: 'insensitive' as const } },
            { mobileNumber: { contains: search } },
            {
              identities: {
                some: {
                  email: { contains: search, mode: 'insensitive' as const },
                },
              },
            },
          ],
        }
      : {};

    // Fetch users with pagination
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          identities: {
            select: {
              id: true,
              provider: true,
              email: true,
              emailVerified: true,
            },
          },
          roles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Transform users to include computed fields
    const transformedUsers = users.map((user) => ({
      id: user.id,
      mobileNumber: user.mobileNumber,
      mobileVerified: user.mobileVerified,
      username: user.username,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      linkedinUrl: user.linkedinUrl,
      instagramUrl: user.instagramUrl,
      githubUrl: user.githubUrl,
      websiteUrl: user.websiteUrl,
      isOnboarded: user.isOnboarded,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      email: user.identities.find((i) => i.email)?.email || null,
      emailVerified:
        user.identities.find((i) => i.email)?.emailVerified || false,
      roles: user.roles.map((ur) => ur.role.code),
      identitiesCount: user.identities.length,
    }));

    return {
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID (ADMIN only)
   */
  async getUserByIdAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        identities: {
          select: {
            id: true,
            provider: true,
            email: true,
            emailVerified: true,
            createdAt: true,
          },
        },
        roles: {
          include: {
            role: true,
            assignedByUser: {
              select: {
                id: true,
                fullName: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Transform user data
    return {
      user: {
        id: user.id,
        mobileNumber: user.mobileNumber,
        mobileVerified: user.mobileVerified,
        username: user.username,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        linkedinUrl: user.linkedinUrl,
        instagramUrl: user.instagramUrl,
        githubUrl: user.githubUrl,
        websiteUrl: user.websiteUrl,
        isOnboarded: user.isOnboarded,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        email: user.identities.find((i) => i.email)?.email || null,
        emailVerified:
          user.identities.find((i) => i.email)?.emailVerified || false,
        roles: user.roles.map((ur) => ({
          id: ur.id,
          code: ur.role.code,
          name: ur.role.name,
          scope: ur.role.scope,
          spaceId: ur.spaceId,
          assignedBy: ur.assignedByUser,
          assignedAt: ur.createdAt,
        })),
        identities: user.identities,
      },
    };
  }

  /**
   * Update user by ID (ADMIN only)
   */
  async updateUserByIdAdmin(userId: string, dto: UpdateProfileDto) {
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
      include: {
        identities: {
          select: {
            id: true,
            provider: true,
            email: true,
            emailVerified: true,
          },
        },
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return {
      user: {
        id: user.id,
        mobileNumber: user.mobileNumber,
        mobileVerified: user.mobileVerified,
        username: user.username,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        linkedinUrl: user.linkedinUrl,
        instagramUrl: user.instagramUrl,
        githubUrl: user.githubUrl,
        websiteUrl: user.websiteUrl,
        isOnboarded: user.isOnboarded,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        email: user.identities.find((i) => i.email)?.email || null,
        emailVerified:
          user.identities.find((i) => i.email)?.emailVerified || false,
        roles: user.roles.map((ur) => ur.role.code),
      },
      message: 'User updated successfully',
    };
  }

  /**
   * Get current user profile
   */
  async getMe(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: { select: { code: true, name: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return UserProfileDto.fromUser(user, (user as any).roles);
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
        gender: dto.gender,
        linkedinUrl: dto.linkedinUrl,
        instagramUrl: dto.instagramUrl,
        githubUrl: dto.githubUrl,
        websiteUrl: dto.websiteUrl,
      },
    });

    return UserProfileDto.fromUser(user, (user as any).roles);
  }

  /**
   * Mark user as onboarded
   */
  async completeOnboarding(userId: string, data?: { username?: string; fullName?: string; city?: string; referralCode?: string }): Promise<UserProfileDto> {
    if (data?.username) {
      const available = await this.isUsernameAvailable(data.username, userId);
      if (!available) throw new ConflictException('Username is already taken');
    }
    if (data?.referralCode) {
      const referrer = await this.prisma.user.findFirst({ where: { referralCode: data.referralCode } });
      if (referrer && referrer.id !== userId) {
        this.prisma.wallet.updateMany({ where: { userId: referrer.id }, data: { balance: { increment: 50 } } }).catch(() => {});
      }
    }
    const updateData: any = { isOnboarded: true };
    if (data?.username) updateData.username = data.username;
    if (data?.fullName) updateData.fullName = data.fullName;
    if (data?.city) updateData.city = data.city;
    const user = await this.prisma.user.update({ where: { id: userId }, data: updateData });
    return UserProfileDto.fromUser(user, (user as any).roles);
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

    return UserProfileDto.fromUser(user, (user as any).roles);
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
    this.logger.log(`Uploading avatar for user ${userId}`);

    // Upload to S3 using StorageService
    const avatarUrl = await this.storageService.uploadFile(
      file,
      'avatars/',
      userId,
    );

    this.logger.log(`Avatar uploaded successfully: ${avatarUrl}`);

    // Update user avatar URL
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return { avatarUrl };
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
        isPrimary: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return identities;
  }

  async setPrimaryIdentity(userId: string, identityId: string) {
    const identity = await this.prisma.userIdentity.findUnique({
      where: { id: identityId },
    });
    if (!identity || identity.userId !== userId) {
      throw new NotFoundException('Identity not found');
    }
    if (!identity.email) {
      throw new BadRequestException('Only email identities can be set as primary');
    }
    await this.prisma.$transaction([
      this.prisma.userIdentity.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      }),
      this.prisma.userIdentity.update({
        where: { id: identityId },
        data: { isPrimary: true },
      }),
    ]);
    return { message: 'Primary email updated' };
  }

  async removeIdentity(userId: string, identityId: string) {
    const identity = await this.prisma.userIdentity.findUnique({
      where: { id: identityId },
    });
    if (!identity || identity.userId !== userId) {
      throw new NotFoundException('Identity not found');
    }
    const count = await this.prisma.userIdentity.count({ where: { userId } });
    if (count <= 1) {
      throw new BadRequestException('Cannot remove your only linked account');
    }
    if (identity.isPrimary) {
      const next = await this.prisma.userIdentity.findFirst({
        where: { userId, id: { not: identityId }, email: { not: null } },
        orderBy: { createdAt: 'asc' },
      });
      if (next) {
        await this.prisma.userIdentity.update({
          where: { id: next.id },
          data: { isPrimary: true },
        });
      }
    }
    await this.prisma.userIdentity.delete({ where: { id: identityId } });
    return { message: 'Account unlinked successfully' };
  }

  /**
   * Get user's spaces (where user is a member)
   */
  async getUserSpaces(userId: string) {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        space: {
          status: 'ACTIVE',
        },
      },
      include: {
        space: {
          include: {
            creator: {
              select: {
                id: true,
                fullName: true,
                username: true,
              },
            },
            _count: {
              select: {
                userRoles: true,
              },
            },
          },
        },
        role: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform to match Space interface expected by frontend
    // Filter out any UserRoles without spaces (shouldn't happen due to where clause, but needed for TypeScript)
    return userRoles
      .filter((ur) => ur.space !== null)
      .map((ur) => ({
        id: ur.space!.id,
        name: ur.space!.name,
        slug: ur.space!.slug,
        description: ur.space!.description,
        logo_url: ur.space!.logoUrl,
        banner_url: ur.space!.bannerUrl,
        city: ur.space!.city,
        state: ur.space!.state,
        country: ur.space!.country,
        visibility: ur.space!.visibility,
        status: ur.space!.status,
        member_count: ur.space!._count.userRoles,
        event_count: 0, // Events not yet implemented
        creator: ur.space!.creator,
        userRole: {
          id: ur.role.id,
          code: ur.role.code,
          name: ur.role.name,
        },
        createdAt: ur.space!.createdAt,
        updatedAt: ur.space!.updatedAt,
      }));
  }

  /**
   * Delete the current user's account.
   * Relies on Prisma cascade deletes for identities, roles, wallet,
   * registrations, etc.
   */
  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'Account deleted successfully' };
  }
}
