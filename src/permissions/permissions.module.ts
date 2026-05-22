import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PlatformAdminGuard } from './guards/platform-admin.guard';
import { OrgPermissionGuard } from './guards/org-permission.guard';
import { DatabaseModule } from '../common/database/database.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [DatabaseModule, RolesModule],
  providers: [PermissionsService, PlatformAdminGuard, OrgPermissionGuard],
  exports: [PermissionsService, PlatformAdminGuard, OrgPermissionGuard],
})
export class PermissionsModule {}
