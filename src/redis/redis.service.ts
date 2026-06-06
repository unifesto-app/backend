import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private healthy = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeClient();
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis client disconnected');
    }
  }

  /**
   * Initialize Redis client with TLS support and exponential backoff retry logic
   */
  private async initializeClient(): Promise<void> {
    const host = this.configService.get<string>('REDIS_HOST');
    const port = this.configService.get<number>('REDIS_PORT');
    const tlsEnabled = this.configService.get<string>('REDIS_TLS') === 'true';

    if (!host || !port) {
      this.logger.error('Redis configuration missing - REDIS_HOST or REDIS_PORT not set');
      return;
    }

    const retryDelays = [1000, 2000, 4000]; // 1s, 2s, 4s
    let attempt = 0;

    const retryStrategy = (times: number) => {
      if (times > retryDelays.length) {
        this.logger.error('Redis connection failed after maximum retry attempts', {
          host,
          port,
          tls: tlsEnabled,
          attempts: retryDelays.length,
        });
        return null; // Stop retrying
      }

      const delay = retryDelays[times - 1];
      this.logger.warn(`Redis connection attempt ${times} failed, retrying in ${delay}ms`);
      return delay;
    };

    try {
      this.client = new Redis({
        host,
        port,
        tls: tlsEnabled ? {} : undefined, // Enable TLS if configured
        retryStrategy,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false, // Connect immediately
      });

      // Connection event handlers
      this.client.on('connect', () => {
        this.logger.log('Redis client connecting...');
      });

      this.client.on('ready', () => {
        this.healthy = true;
        this.logger.log('Redis connection established successfully', {
          host,
          port,
          tls: tlsEnabled,
        });
      });

      this.client.on('error', (error) => {
        this.healthy = false;
        this.logger.error('Redis connection error', {
          host,
          port,
          tls: tlsEnabled,
          error: error.message,
        });
      });

      this.client.on('close', () => {
        this.healthy = false;
        this.logger.warn('Redis connection closed');
      });

      this.client.on('reconnecting', () => {
        this.logger.log('Redis client reconnecting...');
      });

      // Wait for connection to be ready or fail
      await this.client.ping();
      this.logger.log('Redis ping successful');
    } catch (error) {
      this.healthy = false;
      this.client = null;
      this.logger.error('Redis initialization failed - application will continue with degraded functionality', {
        host,
        port,
        tls: tlsEnabled,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get the Redis client instance
   * @returns Redis client or null if connection failed
   */
  getClient(): Redis | null {
    return this.client;
  }

  /**
   * Check if Redis connection is healthy
   * @returns boolean indicating connection status
   */
  isHealthy(): boolean {
    return this.healthy;
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }

  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}
