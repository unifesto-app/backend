import { Module, Logger } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { SpacesModule } from './spaces/spaces.module';
import { DiscussionsModule } from './discussions/discussions.module';
import { StorageModule } from './storage/storage.module';
import { RedisModule } from './redis/redis.module';
import { RedisService } from './redis/redis.service';

@Module({
  imports: [
    // Load environment variables from .env file
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Global throttler configuration with Redis-backed storage
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      useFactory: (redisService: RedisService) => {
        const logger = new Logger('ThrottlerModule');
        const redisClient = redisService.getClient();

        if (redisClient) {
          logger.log('Throttler using Redis storage backend');
          return {
            throttlers: [
              {
                ttl: 60000, // 60 seconds
                limit: 100, // 100 requests per 60 seconds
              },
            ],
            storage: new ThrottlerStorageRedisService(redisClient),
          };
        } else {
          logger.warn(
            'Throttler falling back to in-memory storage - Redis unavailable',
          );
          return {
            throttlers: [
              {
                ttl: 60000, // 60 seconds
                limit: 100, // 100 requests per 60 seconds
              },
            ],
            // storage: undefined defaults to in-memory storage
          };
        }
      },
      inject: [RedisService],
    }),
    // Config Validation (validates AWS environment variables)
    ConfigModule,
    // Redis Module (global scope for throttler and caching)
    RedisModule,
    // Core Modules
    PrismaModule,
    StorageModule,
    AuthModule,
    UsersModule,
    RolesModule,
    SpacesModule,
    DiscussionsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
