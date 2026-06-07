import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminEmailController } from './admin-email.controller';
import { AdminEmailService } from './admin-email.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { StorageModule } from '../storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, RedisModule, StorageModule, AuthModule, EmailModule],
  controllers: [AdminController, AdminEmailController],
  providers: [AdminService, AdminEmailService],
  exports: [AdminService, AdminEmailService],
})
export class AdminModule {}
