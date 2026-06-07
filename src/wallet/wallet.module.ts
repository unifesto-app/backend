import { AuthModule } from '../auth/auth.module';
import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { PartnersController } from './partners.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [AuthModule, PrismaModule, CacheModule, EmailModule],
  controllers: [WalletController, PartnersController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
