import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminEmailController } from './admin-email.controller';
import { AdminEmailService } from './admin-email.service';
import { AdminSchedulerService } from './admin-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { StorageModule } from '../storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, RedisModule, StorageModule, AuthModule, EmailModule, UsersModule],
  controllers: [AdminController, AdminEmailController],
  providers: [AdminService, AdminEmailService, AdminSchedulerService],
  exports: [AdminService, AdminEmailService],
})
export class AdminModule {}
