import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateSpaceDto, UpdateSpaceDto, UpdateSpaceStatusDto } from './dto';
import { SpaceStatus, SpaceVisibility } from '@prisma/client';
import WebSocket from 'ws';

@Injectable()
export class SpacesService {
  private readonly logger = new Logger(SpacesService.name);
  private readonly supabase: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL')!;
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    )!;
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      realtime: { transport: WebSocket as any },
    });
  }

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
          },
        },
      },
    });

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
    const space = await this.prisma.space.findUnique({ where: { id } });

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

    const fileName = `${id}-logo-${Date.now()}.${file.mimetype.split('/')[1]}`;
    const filePath = `space-logos/${fileName}`;

    const { error: uploadError } = await this.supabase.storage
      .from('space-assets')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      throw new ConflictException(
        `Failed to upload logo: ${uploadError.message}`,
      );
    }

    const {
      data: { publicUrl },
    } = this.supabase.storage.from('space-assets').getPublicUrl(filePath);

    await this.prisma.space.update({
      where: { id },
      data: { logoUrl: publicUrl },
    });

    return { logoUrl: publicUrl };
  }

  /**
   * Upload space banner
   */
  async uploadBanner(id: string, file: Express.Multer.File) {
    const space = await this.prisma.space.findUnique({ where: { id } });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    const fileName = `${id}-banner-${Date.now()}.${file.mimetype.split('/')[1]}`;
    const filePath = `space-banners/${fileName}`;

    const { error: uploadError } = await this.supabase.storage
      .from('space-assets')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      throw new ConflictException(
        `Failed to upload banner: ${uploadError.message}`,
      );
    }

    const {
      data: { publicUrl },
    } = this.supabase.storage.from('space-assets').getPublicUrl(filePath);

    await this.prisma.space.update({
      where: { id },
      data: { bannerUrl: publicUrl },
    });

    return { bannerUrl: publicUrl };
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
}
