import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatEncryptionService } from './chat-encryption.service';
import { ModerationService } from './moderation/moderation.service';
import { KeywordFilterService } from './moderation/keyword-filter.service';
import { ModerationApiService } from './moderation/moderation-api.service';

@Module({
  imports: [
    PrismaModule,
    // AuthModule exports AuthService — used by both the HTTP JwtAuthGuard
    // and the WebSocket gateway for token validation.
    AuthModule,
    StorageModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    ChatService,
    ChatEncryptionService,
    ModerationService,
    KeywordFilterService,
    ModerationApiService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
