import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { StorageService } from '../storage/storage.service';
import { EmailService } from '../email/email.service';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

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

    // FCM sending logic will be added when firebase-admin is configured
  }

}