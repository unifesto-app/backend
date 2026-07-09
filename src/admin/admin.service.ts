import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { execSync } from 'child_process';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { StorageService } from '../storage/storage.service';
import { EmailService } from '../email/email.service';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getFirebaseAdmin } from '../firebase/firebase-admin.provider';
import { SpaceStatus } from '@prisma/client';

export interface ServiceStatus {
  status: 'connected' | 'disconnected';
  latency: number;
  message: string;
}

export interface AppStatus {
  status: 'online';
  uptime: number;
  memoryMB: number;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
    storage: ServiceStatus;
    app: AppStatus;
  };
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly startTime: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly storage: StorageService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    this.startTime = Date.now();
    const region = this.configService.get<string>('AWS_REGION');
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME') || '';
    
    this.s3Client = new S3Client({
      region: region,
    });
  }

  /**
   * Check health of all infrastructure services
   */
  async getHealthStatus(): Promise<HealthResponse> {
    const timestamp = new Date().toISOString();

    // Run all health checks in parallel
    const [database, redis, storage, app] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkRedisHealth(),
      this.checkStorageHealth(),
      this.checkAppHealth(),
    ]);

    // Determine overall status
    const connectedServices = [
      database.status === 'connected',
      redis.status === 'connected',
      storage.status === 'connected',
    ];

    const allConnected = connectedServices.every((s) => s === true);
    const allDisconnected = connectedServices.every((s) => s === false);

    let overallStatus: 'healthy' | 'degraded' | 'down';
    if (allConnected) {
      overallStatus = 'healthy';
    } else if (allDisconnected) {
      overallStatus = 'down';
    } else {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp,
      services: {
        database,
        redis,
        storage,
        app,
      },
    };
  }

  /**
   * Check PostgreSQL database health via Prisma
   */
  private async checkDatabaseHealth(): Promise<ServiceStatus> {
    const startTime = Date.now();

    try {
      // Run a simple SELECT 1 query
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;

      this.logger.debug(`Database health check passed (${latency}ms)`);

      return {
        status: 'connected',
        latency,
        message: 'Database connection successful',
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      const message =
        error instanceof Error ? error.message : 'Unknown database error';

      this.logger.error('Database health check failed', {
        error: message,
        latency,
      });

      return {
        status: 'disconnected',
        latency,
        message: `Database error: ${message}`,
      };
    }
  }

  /**
   * Check Redis health via ioredis
   */
  private async checkRedisHealth(): Promise<ServiceStatus> {
    const startTime = Date.now();

    try {
      const client = this.redis.getClient();

      if (!client) {
        return {
          status: 'disconnected',
          latency: 0,
          message: 'Redis client not initialized',
        };
      }

      // Run a PING command
      await client.ping();
      const latency = Date.now() - startTime;

      this.logger.debug(`Redis health check passed (${latency}ms)`);

      return {
        status: 'connected',
        latency,
        message: 'Redis connection successful',
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      const message =
        error instanceof Error ? error.message : 'Unknown Redis error';

      this.logger.error('Redis health check failed', {
        error: message,
        latency,
      });

      return {
        status: 'disconnected',
        latency,
        message: `Redis error: ${message}`,
      };
    }
  }

  /**
   * Check S3 storage health via AWS SDK
   */
  private async checkStorageHealth(): Promise<ServiceStatus> {
    const startTime = Date.now();

    try {
      // List objects with maxKeys=1 to minimize data transfer
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        MaxKeys: 1,
      });

      await this.s3Client.send(command);
      const latency = Date.now() - startTime;

      this.logger.debug(`Storage health check passed (${latency}ms)`);

      return {
        status: 'connected',
        latency,
        message: 'S3 storage connection successful',
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      const message =
        error instanceof Error ? error.message : 'Unknown S3 error';

      this.logger.error('Storage health check failed', {
        error: message,
        latency,
      });

      return {
        status: 'disconnected',
        latency,
        message: `S3 error: ${message}`,
      };
    }
  }

  /**
   * Check application health
   */
  private async checkAppHealth(): Promise<AppStatus> {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000); // seconds
    const memoryUsage = process.memoryUsage();
    const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

    return {
      status: 'online',
      uptime,
      memoryMB,
    };
  }

  /**
   * Send expiring subscription reminder emails
   * Should be called by a scheduled job 7 days before expiry
   */
  async sendExpiringSubscriptionEmails(): Promise<void> {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const sixDaysFromNow = new Date();
    sixDaysFromNow.setDate(sixDaysFromNow.getDate() + 6);

    const expiring = await this.prisma.orgSubscription.findMany({
      where: {
        expiresAt: { gte: sixDaysFromNow, lte: sevenDaysFromNow },
        isActive: true,
        plan: { not: 'STARTER' },
      },
      include: {
        user: {
          include: {
            identities: { where: { email: { not: null } }, select: { email: true }, take: 1 },
          },
        },
      },
    });

    for (const sub of expiring) {
      const email = sub.user.identities[0]?.email;
      if (email && sub.expiresAt) {
        await this.emailService
          .sendSubscriptionExpiring({
            email,
            userName: sub.user.fullName || sub.user.username || 'there',
            plan: sub.plan,
            expiresAt: this.formatDate(sub.expiresAt),
            renewUrl: 'https://forge.unifesto.app/subscription',
          })
          .catch((err) =>
            this.logger.error('Failed to send expiring subscription email', err),
          );
      }
    }

    this.logger.log(`Sent expiring subscription emails to ${expiring.length} users`);
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  async registerDeviceToken(userId: string, fcmToken: string, platform: string): Promise<{ message: string }> {
    await this.prisma.adminDevice.upsert({
      where: { fcmToken },
      create: { userId, fcmToken, platform },
      update: { userId, platform },
    });
    this.logger.log('Registered FCM token for user: ' + userId);
    return { message: 'Device token registered' };
  }

  async unregisterDeviceToken(userId: string, fcmToken: string): Promise<{ message: string }> {
    await this.prisma.adminDevice.deleteMany({
      where: { userId, fcmToken },
    });
    return { message: 'Device token unregistered' };
  }

  async sendPushToAdmins(title: string, body: string, data?: Record<string, string>): Promise<void> {
    // Get all admin device tokens
    const devices = await this.prisma.adminDevice.findMany({
      include: { user: { include: { roles: { include: { role: true } } } } },
    });

    const adminDevices = devices.filter(d =>
      d.user.roles.some(r => r.role.code === 'ADMIN')
    );

    if (adminDevices.length === 0) return;

    const tokens = adminDevices.map((d) => d.fcmToken);

    // Data payloads must be string-only key/value pairs for FCM.
    const stringData = data
      ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
      : undefined;

    try {
      const messaging = getFirebaseAdmin().messaging();
      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: stringData,
      });

      this.logger.log(
        `Admin push sent: ${response.successCount} succeeded, ${response.failureCount} failed`,
      );

      // Clean up tokens that are no longer valid (uninstalled app, expired token, etc)
      // so admin_devices doesn't accumulate dead rows over time.
      const invalidTokens: string[] = [];
      response.responses.forEach((r, i) => {
        if (
          !r.success &&
          (r.error?.code === 'messaging/invalid-registration-token' ||
            r.error?.code === 'messaging/registration-token-not-registered')
        ) {
          invalidTokens.push(tokens[i]);
        }
      });
      if (invalidTokens.length > 0) {
        await this.prisma.adminDevice.deleteMany({
          where: { fcmToken: { in: invalidTokens } },
        });
        this.logger.log(`Removed ${invalidTokens.length} stale admin device token(s).`);
      }
    } catch (err) {
      this.logger.error(`Failed to send admin push notifications: ${err.message}`);
    }
  }

  /**
   * Platform-wide analytics overview.
   */
  async getAnalyticsOverview() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers30d,
      totalSpaces,
      activeSpaces,
      pendingSpaceRequests,
      totalEvents,
      publishedEvents,
      totalRegistrations,
      revenueAgg,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.space.count(),
      this.prisma.space.count({ where: { status: 'ACTIVE' } }),
      this.prisma.spaceRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.event.count(),
      this.prisma.event.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.eventRegistration.count(),
      this.prisma.eventRegistration.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'PAID' },
      }),
    ]);

    return {
      users: { total: totalUsers, newLast30Days: newUsers30d },
      spaces: {
        total: totalSpaces,
        active: activeSpaces,
        pendingRequests: pendingSpaceRequests,
      },
      events: { total: totalEvents, published: publishedEvents },
      registrations: { total: totalRegistrations },
      revenue: { totalPaid: revenueAgg._sum.totalAmount ?? 0 },
      generatedAt: now.toISOString(),
    };
  }

  /**
   * List ALL spaces across the platform (ADMIN only), mapped to the shape the
   * Apex dashboard expects. Each space is annotated with its member-role
   * breakdown (Organiser / Co-Organiser / Member).
   */
  async getAllSpacesAdmin(params: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { page = 1, limit = 20, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
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
            select: { id: true, fullName: true, username: true },
          },
          parentSpace: {
            select: { id: true, name: true, slug: true },
          },
          userRoles: {
            select: { role: { select: { code: true } } },
          },
          _count: { select: { userRoles: true, childSpaces: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.space.count({ where }),
    ]);

    const mapped = spaces.map((space) => {
      const roleCounts = { organisers: 0, coOrganisers: 0, members: 0 };
      for (const ur of space.userRoles) {
        switch (ur.role?.code) {
          case 'ORGANISER':
            roleCounts.organisers += 1;
            break;
          case 'CO_ORGANISER':
            roleCounts.coOrganisers += 1;
            break;
          case 'MEMBER':
            roleCounts.members += 1;
            break;
        }
      }
      return {
        id: space.id,
        name: space.name,
        slug: space.slug,
        description: space.description,
        logo_url: space.logoUrl,
        banner_url: space.bannerUrl,
        city: space.city,
        state: space.state,
        country: space.country,
        visibility: space.visibility,
        status: space.status,
        // SUPER (parent) or REGULAR (individual / child).
        type: space.type,
        parent_space_id: space.parentSpaceId,
        parentSpace: space.parentSpace,
        child_count: space._count.childSpaces,
        member_count: space._count.userRoles,
        roleCounts,
        rejection_reason: space.rejectionReason,
        creator: space.creator,
        createdAt: space.createdAt,
        updatedAt: space.updatedAt,
      };
    });

    return {
      spaces: mapped,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Approve a pending space (ADMIN only). Moves the space out of the review
   * queue and makes it live.
   */
  async approveSpace(id: string, adminId: string) {
    const space = await this.prisma.space.findUnique({ where: { id } });
    if (!space) {
      throw new NotFoundException('Space not found');
    }
    if (space.status === SpaceStatus.APPROVED || space.status === SpaceStatus.ACTIVE) {
      throw new BadRequestException('Space is already approved');
    }

    const updated = await this.prisma.space.update({
      where: { id },
      data: {
        status: SpaceStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: adminId,
        rejectedAt: null,
        rejectionReason: null,
      },
      select: { id: true, name: true, status: true, approvedAt: true, approvedBy: true },
    });
    this.logger.log(`Space ${id} approved by admin ${adminId}`);
    return updated;
  }

  /**
   * Reject a pending space (ADMIN only), recording the reason shown to the
   * organiser.
   */
  async rejectSpace(id: string, adminId: string, reason?: string) {
    const space = await this.prisma.space.findUnique({ where: { id } });
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    const updated = await this.prisma.space.update({
      where: { id },
      data: {
        status: SpaceStatus.REJECTED,
        rejectedAt: new Date(),
        approvedBy: adminId,
        rejectionReason: reason?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        status: true,
        rejectedAt: true,
        rejectionReason: true,
      },
    });
    this.logger.log(`Space ${id} rejected by admin ${adminId}`);
    return updated;
  }

  /**
   * Manage a space's lifecycle state (ADMIN only) — e.g. ACTIVE, INACTIVE,
   * SUSPENDED, ARCHIVED. Approval/rejection have dedicated endpoints; this is
   * for post-approval state management.
   */
  async updateSpaceStatus(id: string, status: SpaceStatus, adminId: string) {
    const space = await this.prisma.space.findUnique({ where: { id } });
    if (!space) {
      throw new NotFoundException('Space not found');
    }
    if (!Object.values(SpaceStatus).includes(status)) {
      throw new BadRequestException(`Invalid space status: ${status}`);
    }

    const updated = await this.prisma.space.update({
      where: { id },
      data: { status },
      select: { id: true, name: true, status: true },
    });
    this.logger.log(`Space ${id} status set to ${status} by admin ${adminId}`);
    return updated;
  }

  /**
   * List all events (incl. drafts) for moderation.
   */
  async getPm2Logs(params: { lines: number; search?: string }) {
    try {
      const raw = execSync(
        `pm2 logs unifesto --lines ${params.lines} --nostream`,
        { encoding: 'utf8', timeout: 10000 }
      );
      const ansi = /\x1B\[[0-9;]*m|\x1B\[[0-9;]*[A-Za-z]/g;
      const lines = raw.split('\n').filter(Boolean).map(l => l.replace(ansi, ''));
      const filtered = params.search
        ? lines.filter(l => l.toLowerCase().includes(params.search!.toLowerCase()))
        : lines;
      return {
        lines: filtered.slice(-params.lines),
        total: filtered.length,
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        lines: [],
        total: 0,
        error: 'Failed to fetch PM2 logs',
        fetchedAt: new Date().toISOString(),
      };
    }
  }

  async getAllEvents(params: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
  }) {
    const { page, limit, status, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          space: { select: { id: true, name: true, slug: true } },
          creator: { select: { id: true, fullName: true, username: true } },
          _count: { select: { registrations: true } },
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

}
