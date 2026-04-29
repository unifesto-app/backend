import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { DatabaseModule } from './common/database/database.module';

@Module({
  imports: [DatabaseModule, AuthModule, WalletModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
