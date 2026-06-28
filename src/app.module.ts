import { Module, Logger } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { APP_GUARD } from '@nestjs/core';
import { CategoriesModule } from './categories/categories.module';
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
import { AdminModule } from './admin/admin.module';
import { AwsModule } from './aws/aws.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { WalletModule } from './wallet/wallet.module';
import { ReferralsModule } from './referrals/referrals.module';
import { EventsModule } from './events/events.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { CheckinModule } from './checkin/checkin.module';
import { PayoutsModule } from './payouts/payouts.module';

@Module({
  imports: [
    CategoriesModule,
    // Load environment variables from .env file
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Enable scheduled jobs and cron tasks
    ScheduleModule.forRoot(),
    // Global throttler configuration with Redis-backed storage
    ThrottlerModule.forRootAsync({
      imports: [
    CategoriesModule,RedisModule],
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
    AdminModule,
    AwsModule,
    // Event Tech Platform Modules
    SubscriptionModule,
    WalletModule,
    ReferralsModule,
    EventsModule,
    RegistrationsModule,
    CheckinModule,
    PayoutsModule,
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
