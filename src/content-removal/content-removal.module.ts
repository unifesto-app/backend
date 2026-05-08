import { Module } from '@nestjs/common';
import { ContentRemovalController } from './content-removal.controller';
import { ContentRemovalService } from './content-removal.service';
import { DatabaseModule } from '../common/database/database.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, PermissionsModule, AuthModule],
  controllers: [ContentRemovalController],
  providers: [ContentRemovalService],
  exports: [ContentRemovalService],
})
export class ContentRemovalModule {}
