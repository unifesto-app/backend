import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SpacesController } from './spaces.controller';
import { SpacesService } from './spaces.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../auth/guards';

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule],
  controllers: [SpacesController],
  providers: [SpacesService, RolesGuard],
  exports: [SpacesService],
})
export class SpacesModule {}
