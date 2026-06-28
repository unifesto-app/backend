import { Module } from '@nestjs/common';
import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';
import { PayoutsSchedulerService } from './payouts-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule, AuthModule],
  controllers: [PayoutsController],
  providers: [PayoutsService, PayoutsSchedulerService],
  exports: [PayoutsService],
})
export class PayoutsModule {}
