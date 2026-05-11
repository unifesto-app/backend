import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { PublicOrganizationsController } from './public-organizations.controller';
import { OrganizationsService } from './organizations.service';
import { PublicOrganizationsService } from './public-organizations.service';
import { DatabaseModule } from '../common/database/database.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, PermissionsModule, AuthModule],
  controllers: [OrganizationsController, PublicOrganizationsController],
  providers: [OrganizationsService, PublicOrganizationsService],
  exports: [OrganizationsService, PublicOrganizationsService],
})
export class OrganizationsModule {}
