import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationSettingsController } from './notification-settings.controller';
import { NotificationSettingsService } from './notification-settings.service';

@Module({
  // AuthModule exports the JwtAuthGuard/AuthService used by the controller.
  imports: [PrismaModule, AuthModule],
  controllers: [NotificationSettingsController],
  providers: [NotificationSettingsService],
  exports: [NotificationSettingsService],
})
export class NotificationSettingsModule {}
