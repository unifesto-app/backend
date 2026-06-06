import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { StorageService } from '../storage/storage.service';
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
}
