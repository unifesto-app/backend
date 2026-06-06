import { AuthModule } from '../auth/auth.module';
import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { PartnersController } from './partners.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [AuthModule, AuthModule, PrismaModule, CacheModule],
  controllers: [WalletController, PartnersController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
