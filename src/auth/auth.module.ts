import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AvatarService } from './avatar.service';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { DatabaseModule } from '../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService, AvatarService, SupabaseAuthGuard, RolesGuard],
  exports: [AuthService, AvatarService, SupabaseAuthGuard, RolesGuard],
})
export class AuthModule {}
