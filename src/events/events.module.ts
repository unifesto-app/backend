import { AuthModule } from '../auth/auth.module';
import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventSchedulerService } from './event-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { CacheModule } from '../cache/cache.module';
import { EmailModule } from '../email/email.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    StorageModule,
    SubscriptionModule,
    CacheModule,
    EmailModule,
    WhatsAppModule,
    ChatModule,
  ],
  controllers: [EventsController],
  providers: [EventsService, EventSchedulerService],
  exports: [EventsService],
})
export class EventsModule {}
