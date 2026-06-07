import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { CreateSpaceDto, UpdateSpaceDto, UpdateSpaceStatusDto } from './dto';
import { SpaceStatus, SpaceVisibility } from '@prisma/client';

@Injectable()
export class SpacesService {
  private readonly logger = new Logger(SpacesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create a new space
   */
  async createSpace(dto: CreateSpaceDto, createdBy: string) {
    // Check if slug is already taken
    const existing = await this.prisma.space.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Space slug is already taken');
    }

    const space = await this.prisma.space.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        websiteUrl: dto.websiteUrl,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        tags: dto.tags || [],
        visibility: dto.visibility || SpaceVisibility.PUBLIC,
        coOrganiserLimit: dto.coOrganiserLimit || 5,
        createdBy,
        status: SpaceStatus.PENDING,
        submittedAt: new Date(),
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
            mobileNumber: true,
          },
        },
      },
    });

    // Send notification to admin (non-blocking)
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    if (adminEmail) {
      this.emailService.sendNewSpaceSubmittedToAdmin({
        adminEmail,
        spaceName: space.name,
        organizerName: space.creator.fullName || space.creator.username || 'Unknown',
        organizerMobile: space.creator.mobileNumber,
        spaceDescription: space.description || undefined,
        submittedAt: space.submittedAt?.toLocaleString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }) || new Date().toLocaleString(),
      }).catch(err => this.logger.error('Failed to send new space notification email', err));
    }

    return space;
  }

  /**
   * Get all spaces with filters
   */
  async getAllSpaces(params: {
    page?: number;
    limit?: number;
    status?: SpaceStatus;
    visibility?: SpaceVisibility;
    search?: string;
  }) {
    const { page = 1, limit = 10, status, visibility, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (visibility) {
      where.visibility = visibility;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [spaces, total] = await Promise.all([
      this.prisma.space.findMany({
        where,
        skip,
        take: limit,
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
              discussions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.space.count({ where }),
    ]);

    return {
      spaces,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get space by ID
   */
  async getSpaceById(id: string) {
    const space = await this.prisma.space.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                avatarUrl: true,
              },
            },
            role: true,
          },
        },
        _count: {
          select: {
            discussions: true,
          },
        },
      },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    return space;
  }

  /**
   * Get space by slug
   */
  async getSpaceBySlug(slug: string) {
    const space = await this.prisma.space.findUnique({
      where: { slug },
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
            discussions: true,
          },
        },
      },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    return space;
  }

  /**
   * Update space
   */
  async updateSpace(id: string, dto: UpdateSpaceDto) {
    const space = await this.prisma.space.findUnique({ where: { id } });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    // Check slug uniqueness if being changed
    if (dto.slug && dto.slug !== space.slug) {
      const existing = await this.prisma.space.findUnique({
        where: { slug: dto.slug },
      });

      if (existing) {
        throw new ConflictException('Space slug is already taken');
      }
    }

    const updatedSpace = await this.prisma.space.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        websiteUrl: dto.websiteUrl,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        tags: dto.tags,
        visibility: dto.visibility,
        coOrganiserLimit: dto.coOrganiserLimit,
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    return updatedSpace;
  }

  /**
   * Update space status (approve/reject)
   */
  async updateSpaceStatus(
    id: string,
    dto: UpdateSpaceStatusDto,
    approvedBy: string,
  ) {
    const space = await this.prisma.space.findUnique({ 
      where: { id },
      include: {
        creator: {
          include: {
            identities: true,
          },
        },
      },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    const updateData: any = {
      status: dto.status,
    };

    if (dto.status === SpaceStatus.APPROVED) {
      updateData.approvedAt = new Date();
      updateData.approvedBy = approvedBy;
      updateData.rejectedAt = null;
      updateData.rejectionReason = null;
    } else if (dto.status === SpaceStatus.REJECTED) {
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = dto.rejectionReason;
      updateData.approvedAt = null;
      updateData.approvedBy = null;
    }

    const updatedSpace = await this.prisma.space.update({
      where: { id },
      data: updateData,
    });

    // Send email notifications (non-blocking)
    const organizerEmail = space.creator.identities.find(i => i.email)?.email;
    
    if (organizerEmail) {
      if (dto.status === SpaceStatus.APPROVED) {
        this.emailService.sendSpaceApproved({
          email: organizerEmail,
          organizerName: space.creator.fullName || space.creator.username || 'there',
          spaceName: space.name,
          spaceSlug: space.slug,
        }).catch(err => this.logger.error('Failed to send space approved email', err));
      } else if (dto.status === SpaceStatus.REJECTED && dto.rejectionReason) {
        this.emailService.sendSpaceRejected({
          email: organizerEmail,
          organizerName: space.creator.fullName || space.creator.username || 'there',
          spaceName: space.name,
          rejectionReason: dto.rejectionReason,
        }).catch(err => this.logger.error('Failed to send space rejected email', err));
      }
    }

    return updatedSpace;
  }

  /**
   * Delete space
   */
  async deleteSpace(id: string) {
    const space = await this.prisma.space.findUnique({ where: { id } });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    await this.prisma.space.delete({ where: { id } });

    return { message: 'Space deleted successfully' };
  }

  /**
   * Upload space logo
   */
  async uploadLogo(id: string, file: Express.Multer.File) {
    const space = await this.prisma.space.findUnique({ where: { id } });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    // Upload to S3 using StorageService
    const logoUrl = await this.storageService.uploadFile(
      file,
      'space-logos/',
      id,
    );

    await this.prisma.space.update({
      where: { id },
      data: { logoUrl },
    });

    return { logoUrl };
  }

  /**
   * Upload space banner
   */
  async uploadBanner(id: string, file: Express.Multer.File) {
    const space = await this.prisma.space.findUnique({ where: { id } });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    // Upload to S3 using StorageService
    const bannerUrl = await this.storageService.uploadFile(
      file,
      'space-banners/',
      id,
    );

    await this.prisma.space.update({
      where: { id },
      data: { bannerUrl },
    });

    return { bannerUrl };
  }

  /**
   * Get space members with roles
   */
  async getSpaceMembers(spaceId: string) {
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    const members = await this.prisma.userRole.findMany({
      where: { spaceId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatarUrl: true,
          },
        },
        role: true,
      },
      orderBy: [{ role: { code: 'asc' } }, { createdAt: 'asc' }],
    });

    return members;
  }

  /**
   * Join a space (become a member)
   */
  async joinSpace(spaceId: string, userId: string) {
    // Check if space exists and is active
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (space.status !== SpaceStatus.ACTIVE) {
      throw new BadRequestException('Space is not active');
    }

    // Check if user is already a member
    const existingMember = await this.prisma.userRole.findFirst({
      where: {
        userId,
        spaceId,
      },
    });

    if (existingMember) {
      throw new ConflictException('You are already a member of this space');
    }

    // Get the MEMBER role for this space
    const memberRole = await this.prisma.role.findFirst({
      where: {
        code: 'MEMBER',
        scope: 'SPACE',
      },
    });

    if (!memberRole) {
      throw new NotFoundException('Member role not found');
    }

    // Add user as a member
    const userRole = await this.prisma.userRole.create({
      data: {
        userId,
        roleId: memberRole.id,
        spaceId,
      },
      include: {
        role: true,
        space: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return {
      message: 'Successfully joined the space',
      userRole,
    };
  }

  /**
   * Leave a space (remove membership)
   */
  async leaveSpace(spaceId: string, userId: string) {
    // Check if space exists
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    // Check if user is a member
    const membership = await this.prisma.userRole.findFirst({
      where: {
        userId,
        spaceId,
      },
      include: {
        role: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('You are not a member of this space');
    }

    // Don't allow space creator to leave
    if (space.createdBy === userId) {
      throw new BadRequestException('Space creator cannot leave the space');
    }

    // Remove membership
    await this.prisma.userRole.delete({
      where: { id: membership.id },
    });

    return {
      message: 'Successfully left the space',
    };
  }
}
