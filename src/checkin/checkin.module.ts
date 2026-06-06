import { AuthModule } from '../auth/auth.module';
import { Module } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CheckinController } from './checkin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [AuthModule, AuthModule, PrismaModule, WalletModule, CacheModule],
  controllers: [CheckinController],
  providers: [CheckinService],
  exports: [CheckinService],
})
export class CheckinModule {}
