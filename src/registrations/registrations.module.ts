import { AuthModule } from '../auth/auth.module';
import { Module } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { EmailModule } from '../email/email.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { CacheModule } from '../cache/cache.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    WalletModule,
    EmailModule,
    WhatsAppModule,
    CacheModule,
    ChatModule,
  ],
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
