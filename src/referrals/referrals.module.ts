import { AuthModule } from '../auth/auth.module';
import { Module } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [AuthModule, AuthModule, PrismaModule, WalletModule, CacheModule],
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
