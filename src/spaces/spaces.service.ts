import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import {
  CreateSpaceDto,
  UpdateSpaceDto,
  UpdateSpaceStatusDto,
  CreateSpaceStatusRequestDto,
  ReviewSpaceStatusRequestDto,
} from './dto';
import {
  CreateSubSpaceRequestDto,
  ReviewSubSpaceRequestDto,
  SubSpaceRequestType,
} from './dto/sub-space-request.dto';
import { RoleCode, SpaceStatus, SpaceVisibility } from '@prisma/client';

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
    parentId?: string;
  }) {
    const { page = 1, limit = 10, status, visibility, search, parentId } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (visibility) {
      where.visibility = visibility;
    }

    
    if (parentId) { where.parentSpaceId = parentId; }
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
              events: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.space.count({ where }),
    ]);

    const publicSpaces = spaces.map((space: any) => {
      const {
        approvedBy,
        rejectionReason,
        requestedParentId,
        parentRequestPending,
        plan,
        planActivatedAt,
        planExpiresAt,
        coOrganiserLimit,
        ...publicSpace
      } = space;
      return publicSpace;
    });

    return {
      spaces: publicSpaces,
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
  async getSpaceById(id: string, userId?: string) {
    const space = await this.prisma.space.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatarUrl: true,
          },
        },
        parentSpace: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
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
            userRoles: true,
            events: true,
          },
        },
      },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }
    this.logger.log(`parentSpace: ${JSON.stringify((space as any).parentSpace)}`);

    const requesterRole = userId
      ? (space.userRoles.find((ur: any) => ur.userId === userId) || null)
      : null;
    // Flatten to { id, code, name } so clients get the same shape as
    // GET /users/me/spaces (the role code lives on the joined `role`).
    const userRole = requesterRole?.role
      ? {
          id: requesterRole.role.id,
          code: requesterRole.role.code,
          name: requesterRole.role.name,
        }
      : null;

    // Expose the organiser team (co-organisers + organisers) publicly so clients can
    // display them. Only organiser-type roles are surfaced; regular members are not.
    const organiserRoleCodes = [
      RoleCode.ORGANISER,
      RoleCode.CO_ORGANISER,
    ];
    const organisers = space.userRoles
      .filter((ur: any) => organiserRoleCodes.includes(ur.role?.code))
      .map((ur: any) => ({
        id: ur.id,
        user: ur.user,
        role: ur.role,
        createdAt: ur.createdAt,
      }));

    // Strip internal/sensitive fields and the raw member-role list before returning publicly.
    // Only the requester's own role (userRole), the organiser team, and aggregate counts are exposed.
    const {
      userRoles,
      approvedBy,
      rejectionReason,
      requestedParentId,
      parentRequestPending,
      plan,
      planActivatedAt,
      planExpiresAt,
      coOrganiserLimit,
      ...publicSpace
    } = space as any;

    return { ...publicSpace, userRole, organisers };
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
            events: true,
          },
        },
      },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }
    this.logger.log(`parentSpace: ${JSON.stringify((space as any).parentSpace)}`);

    const {
      approvedBy,
      rejectionReason,
      requestedParentId,
      parentRequestPending,
      plan,
      planActivatedAt,
      planExpiresAt,
      coOrganiserLimit,
      ...publicSpace
    } = space as any;

    return publicSpace;
  }

  /**
   * Update space
   */
  async updateSpace(id: string, dto: UpdateSpaceDto) {
    const space = await this.prisma.space.findUnique({ where: { id } });

    if (!space) {
      throw new NotFoundException('Space not found');
    }
    this.logger.log(`parentSpace: ${JSON.stringify((space as any).parentSpace)}`);

    // Rule 1: A child space (has parentSpaceId) cannot be converted to SUPER
    if (dto.type === 'SUPER' && space.parentSpaceId) {
      throw new BadRequestException('A child space cannot be converted to SUPER. Remove the parent space relationship first.');
    }

    // Rule 2: A SUPER space cannot be assigned another SUPER space as parent
    if (dto.parentSpaceId) {
      if (space.type === 'SUPER') {
        throw new BadRequestException('A SUPER space cannot be assigned a parent space.');
      }
      const parentSpace = await this.prisma.space.findUnique({ where: { id: dto.parentSpaceId } });
      if (!parentSpace) throw new NotFoundException('Parent space not found');
      if (parentSpace.type !== 'SUPER') {
        throw new BadRequestException('Parent space must be a SUPER space.');
      }
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
        type: dto.type,
        ...(dto.parentSpaceId !== undefined ? { parentSpaceId: dto.parentSpaceId } : {}),
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
    this.logger.log(`parentSpace: ${JSON.stringify((space as any).parentSpace)}`);

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
    this.logger.log(`parentSpace: ${JSON.stringify((space as any).parentSpace)}`);

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
    this.logger.log(`parentSpace: ${JSON.stringify((space as any).parentSpace)}`);

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
    this.logger.log(`parentSpace: ${JSON.stringify((space as any).parentSpace)}`);

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
    this.logger.log(`parentSpace: ${JSON.stringify((space as any).parentSpace)}`);

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
    this.logger.log(`parentSpace: ${JSON.stringify((space as any).parentSpace)}`);

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
    this.logger.log(`parentSpace: ${JSON.stringify((space as any).parentSpace)}`);

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
  async createSpaceRequest(userId: string, dto: any) {
    // Check if user already has a pending request
    const existing = await this.prisma.spaceRequest.findFirst({
      where: { userId, status: 'PENDING' },
    });

    if (existing) {
      throw new BadRequestException('You already have a pending space request');
    }

    const request = await this.prisma.spaceRequest.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        type: dto.type || 'REGULAR',
        visibility: dto.visibility || 'PUBLIC',
        city: dto.city,
        state: dto.state,
        country: 'India',
        tags: dto.tags || [],
        websiteUrl: dto.websiteUrl,
        status: 'PENDING',
      },
    });

    return request;
  }

  async getMySpaceRequests(userId: string) {
    return this.prisma.spaceRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all space requests (ADMIN) - optionally filtered by status
   */
  async getAllSpaceRequests(status?: string) {
    return this.prisma.spaceRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            mobileNumber: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Approve a space request (ADMIN)
   * Creates the Space (ACTIVE) and grants the requester the ORGANISER role
   * scoped to the new space, all within a single transaction.
   */
  async approveSpaceRequest(requestId: string, adminId: string) {
    const req = await this.prisma.spaceRequest.findUnique({
      where: { id: requestId },
    });
    if (!req) {
      throw new NotFoundException('Space request not found');
    }
    if (req.status !== 'PENDING') {
      throw new BadRequestException('Request has already been reviewed');
    }

    // Build a unique slug from the request name
    const baseSlug = req.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = `${baseSlug || 'space'}-${Date.now().toString(36)}`;

    return this.prisma.$transaction(async (tx) => {
      const space = await tx.space.create({
        data: {
          name: req.name,
          slug,
          description: req.description,
          type: req.type,
          visibility: req.visibility,
          city: req.city,
          state: req.state,
          country: req.country,
          tags: req.tags ?? [],
          websiteUrl: req.websiteUrl,
          status: SpaceStatus.ACTIVE,
          submittedAt: req.createdAt,
          approvedAt: new Date(),
          approvedBy: adminId,
          createdBy: req.userId,
        },
      });

      // Grant ORGANISER role (space-scoped) to the requester
      const organiserRole = await tx.role.findUnique({
        where: { code: 'ORGANISER' as any },
      });
      if (organiserRole) {
        await tx.userRole.create({
          data: {
            userId: req.userId,
            roleId: organiserRole.id,
            spaceId: space.id,
            assignedBy: adminId,
          },
        });
      }

      await tx.spaceRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED', reviewedBy: adminId },
      });

      return space;
    });
  }

  /**
   * Reject a space request (ADMIN)
   */
  async rejectSpaceRequest(
    requestId: string,
    adminId: string,
    reviewNote?: string,
  ) {
    const req = await this.prisma.spaceRequest.findUnique({
      where: { id: requestId },
    });
    if (!req) {
      throw new NotFoundException('Space request not found');
    }
    if (req.status !== 'PENDING') {
      throw new BadRequestException('Request has already been reviewed');
    }

    return this.prisma.spaceRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED', reviewedBy: adminId, reviewNote },
    });
  }

  // =====================================================
  // SPACE STATUS REQUESTS
  // Organisers request a status change for their space;
  // admins approve or reject from Apex.
  // =====================================================

  async createSpaceStatusRequest(userId: string, dto: CreateSpaceStatusRequestDto) {
    // Verify user owns or manages this space
    const space = await this.prisma.space.findUnique({
      where: { id: dto.spaceId },
    });
    if (!space) throw new NotFoundException('Space not found');
    if (space.createdBy !== userId) throw new ForbiddenException('Not your space');

    // Check no pending request exists
    const existing = await this.prisma.spaceStatusRequest.findFirst({
      where: { spaceId: dto.spaceId, status: 'PENDING' },
    });
    if (existing)
      throw new ConflictException(
        'A pending status request already exists for this space',
      );

    // Validate the requested transition
    const allowedTransitions: Record<string, string[]> = {
      ACTIVE: ['INACTIVE'],
      INACTIVE: ['ACTIVE'],
      SUSPENDED: ['ACTIVE'],
      ARCHIVED: ['ACTIVE'], // restoration appeal
    };
    const allowed = allowedTransitions[space.status] || [];
    if (!allowed.includes(dto.requestedStatus)) {
      throw new BadRequestException(
        `Cannot request ${dto.requestedStatus} from current status ${space.status}`,
      );
    }

    return this.prisma.spaceStatusRequest.create({
      data: {
        spaceId: dto.spaceId,
        requestedBy: userId,
        currentStatus: space.status,
        requestedStatus: dto.requestedStatus,
        reason: dto.reason,
        status: 'PENDING',
      },
      include: {
        space: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, fullName: true, username: true } },
      },
    });
  }

  async getMySpaceStatusRequests(userId: string, spaceId?: string) {
    return this.prisma.spaceStatusRequest.findMany({
      where: {
        requestedBy: userId,
        ...(spaceId ? { spaceId } : {}),
      },
      include: {
        space: { select: { id: true, name: true, slug: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllSpaceStatusRequests(status?: string, page = 1, limit = 20) {
    const where = status ? { status } : {};
    const [requests, total] = await Promise.all([
      this.prisma.spaceStatusRequest.findMany({
        where,
        include: {
          space: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              logoUrl: true,
            },
          },
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
              mobileNumber: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.spaceStatusRequest.count({ where }),
    ]);
    return {
      requests,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async reviewSpaceStatusRequest(
    requestId: string,
    adminId: string,
    dto: ReviewSpaceStatusRequestDto,
  ) {
    const req = await this.prisma.spaceStatusRequest.findUnique({
      where: { id: requestId },
      include: {
        space: true,
        user: {
          include: {
            identities: { where: { email: { not: null } }, take: 1 },
          },
        },
      },
    });
    if (!req) throw new NotFoundException('Request not found');
    if (req.status !== 'PENDING')
      throw new BadRequestException('Request already reviewed');

    // Update request
    const updated = await this.prisma.spaceStatusRequest.update({
      where: { id: requestId },
      data: {
        status: dto.status,
        reviewNote: dto.reviewNote || null,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    // If approved, apply the status change
    if (dto.status === 'APPROVED') {
      await this.prisma.space.update({
        where: { id: req.spaceId },
        data: { status: req.requestedStatus as any },
      });
    }

    // Send email notification
    const email = req.user.identities[0]?.email;
    if (email) {
      if (dto.status === 'APPROVED') {
        this.emailService.sendRawEmail(
          email,
          `Space status updated to ${req.requestedStatus} — Unifesto`,
          `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#16a34a">Status Change Approved ✓</h2>
            <p>Hi ${req.user.fullName || req.user.username || 'there'},</p>
            <p>Your request to change <strong>${req.space.name}</strong>'s status to <strong>${req.requestedStatus}</strong> has been approved.</p>
            ${dto.reviewNote ? `<p><strong>Note from admin:</strong> ${dto.reviewNote}</p>` : ''}
            <a href="https://forge.unifesto.app/dashboard/spaces/${req.spaceId}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px">View Space</a>
          </div>`,
        ).catch(() => {});
      } else {
        this.emailService.sendRawEmail(
          email,
          `Space status change request rejected — Unifesto`,
          `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#dc2626">Status Change Request Rejected</h2>
            <p>Hi ${req.user.fullName || req.user.username || 'there'},</p>
            <p>Your request to change <strong>${req.space.name}</strong>'s status to <strong>${req.requestedStatus}</strong> has been rejected.</p>
            ${dto.reviewNote ? `<p><strong>Reason:</strong> ${dto.reviewNote}</p>` : ''}
            <a href="https://forge.unifesto.app/dashboard/spaces/${req.spaceId}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px">View Space</a>
          </div>`,
        ).catch(() => {});
      }
    }

    return updated;
  }

  // =====================================================
  // SUB-SPACE REQUESTS
  // =====================================================

  /**
   * Create a sub-space request (authenticated users)
   */
  async createSubSpaceRequest(userId: string, dto: CreateSubSpaceRequestDto) {
    const { requestType, subSpaceId, targetSpaceId, reason } = dto;

    // Validate target space exists
    const targetSpace = await this.prisma.space.findUnique({
      where: { id: targetSpaceId },
    });
    if (!targetSpace) {
      throw new NotFoundException('Target space not found');
    }

    // For JOIN/CONVERT_AND_JOIN, a sub-space is required
    if (requestType !== SubSpaceRequestType.CONVERT_TO_SUPER) {
      if (!subSpaceId) {
        throw new BadRequestException(
          'subSpaceId is required for this request type',
        );
      }
      const subSpace = await this.prisma.space.findUnique({
        where: { id: subSpaceId },
      });
      if (!subSpace) {
        throw new NotFoundException('Sub-space not found');
      }
      if (subSpaceId === targetSpaceId) {
        throw new BadRequestException(
          'A space cannot be made a sub-space of itself',
        );
      }
      if (subSpace.parentSpaceId) {
        throw new ConflictException(
          'This space already belongs to a super space',
        );
      }
    }

    // Validate requestType against the target space's current type
    if (requestType === SubSpaceRequestType.JOIN_SUPER) {
      if (targetSpace.type !== 'SUPER') {
        throw new BadRequestException(
          'Target space is not a SUPER space; use CONVERT_AND_JOIN instead',
        );
      }
    } else if (requestType === SubSpaceRequestType.CONVERT_AND_JOIN) {
      if (targetSpace.type === 'SUPER') {
        throw new BadRequestException(
          'Target space is already a SUPER space; use JOIN_SUPER instead',
        );
      }
    } else if (requestType === SubSpaceRequestType.CONVERT_TO_SUPER) {
      if (targetSpace.type === 'SUPER') {
        throw new BadRequestException(
          'Target space is already a SUPER space',
        );
      }
    }

    // Prevent duplicate pending requests
    const existing = await this.prisma.subSpaceRequest.findFirst({
      where: {
        targetSpaceId,
        subSpaceId: subSpaceId ?? null,
        requestType,
        status: 'PENDING',
      },
    });
    if (existing) {
      throw new ConflictException(
        'A pending request already exists for this combination',
      );
    }

    return this.prisma.subSpaceRequest.create({
      data: {
        requestType,
        subSpaceId: subSpaceId ?? null,
        targetSpaceId,
        requestedBy: userId,
        reason,
      },
      include: {
        subSpace: { select: { id: true, name: true, slug: true } },
        targetSpace: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  /**
   * Get the current user's sub-space requests
   */
  async getMySubSpaceRequests(userId: string) {
    return this.prisma.subSpaceRequest.findMany({
      where: { requestedBy: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        subSpace: { select: { id: true, name: true, slug: true } },
        targetSpace: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  /**
   * Get all sub-space requests (ADMIN only)
   */
  async getAllSubSpaceRequests(status?: string, page = 1, limit = 20) {
    const where = status ? { status } : {};
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.subSpaceRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          subSpace: { select: { id: true, name: true, slug: true, type: true, logoUrl: true } },
          targetSpace: { select: { id: true, name: true, slug: true, type: true, logoUrl: true } },
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
              mobileNumber: true,
              identities: { select: { email: true } },
            },
          },
        },
      }),
      this.prisma.subSpaceRequest.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Review (approve/reject) a sub-space request (ADMIN only).
   * On approval, applies the requested space-type / parent-space changes.
   */
  async reviewSubSpaceRequest(
    id: string,
    reviewerId: string,
    dto: ReviewSubSpaceRequestDto,
  ) {
    const request = await this.prisma.subSpaceRequest.findUnique({
      where: { id },
      include: {
        subSpace: true,
        targetSpace: true,
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            identities: { select: { email: true } },
          },
        },
      },
    });
    if (!request) {
      throw new NotFoundException('Sub-space request not found');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('This request has already been reviewed');
    }

    const approved = dto.status === 'APPROVED';

    const updated = await this.prisma.$transaction(async (tx) => {
      const reviewed = await tx.subSpaceRequest.update({
        where: { id },
        data: {
          status: dto.status,
          reviewNote: dto.reviewNote ?? null,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        },
      });

      if (approved) {
        // Convert the target space to SUPER when required
        if (
          request.requestType === SubSpaceRequestType.CONVERT_AND_JOIN ||
          request.requestType === SubSpaceRequestType.CONVERT_TO_SUPER
        ) {
          await tx.space.update({
            where: { id: request.targetSpaceId },
            data: { type: 'SUPER' },
          });
        }

        // Assign the sub-space to the target super space
        if (
          request.requestType !== SubSpaceRequestType.CONVERT_TO_SUPER &&
          request.subSpaceId
        ) {
          await tx.space.update({
            where: { id: request.subSpaceId },
            data: { parentSpaceId: request.targetSpaceId },
          });
        }
      }

      return reviewed;
    });

    // Notify requester (fire-and-forget)
    const email = request.user.identities[0]?.email;
    if (email) {
      const name =
        request.user.fullName || request.user.username || 'there';
      if (approved) {
        this.emailService
          .sendRawEmail(
            email,
            `Your sub-space request was approved — Unifesto`,
            `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#16a34a">Sub-Space Request Approved</h2>
              <p>Hi ${name},</p>
              <p>Your request related to <strong>${request.targetSpace.name}</strong> has been approved.</p>
              ${dto.reviewNote ? `<p><strong>Note:</strong> ${dto.reviewNote}</p>` : ''}
            </div>`,
          )
          .catch(() => {});
      } else {
        this.emailService
          .sendRawEmail(
            email,
            `Your sub-space request was rejected — Unifesto`,
            `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#dc2626">Sub-Space Request Rejected</h2>
              <p>Hi ${name},</p>
              <p>Your request related to <strong>${request.targetSpace.name}</strong> has been rejected.</p>
              ${dto.reviewNote ? `<p><strong>Reason:</strong> ${dto.reviewNote}</p>` : ''}
            </div>`,
          )
          .catch(() => {});
      }
    }

    return updated;
  }
}

