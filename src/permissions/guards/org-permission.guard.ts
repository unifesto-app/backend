import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../permissions.service';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import type { RequestUser } from '../../auth/interfaces/user.interface';

@Injectable()
export class OrgPermissionGuard implements CanActivate {
  private readonly logger = new Logger(OrgPermissionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>(
      PERMISSION_KEY,
      context.getHandler(),
    );

    if (!requiredPermission) {
      return true; // No permission required
    }

    const request = context.switchToHttp().getRequest();
    const user: RequestUser = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get orgId from params or body
    const orgId = request.params.id || request.params.orgId || request.body.organization_id;

    if (!orgId) {
      throw new BadRequestException('Organization ID required');
    }

    // Get user's permissions for this organization
    const permissions = await this.permissionsService.getOrgPermissions(
      user.sub,
      orgId,
    );

    // Check specific permission
    let hasPermission = false;

    switch (requiredPermission) {
      case 'manage_organization':
        hasPermission = permissions.canManageOrg;
        break;
      case 'manage_sub_orgs':
        hasPermission = permissions.canManageSubOrgs;
        break;
      case 'manage_members':
        hasPermission = permissions.canManageMembers;
        break;
      case 'create_events':
        hasPermission = permissions.canCreateEvents;
        break;
      case 'manage_events':
        hasPermission = permissions.canManageEvents;
        break;
      case 'approve_events':
        hasPermission = permissions.canApproveEvents;
        break;
      case 'view_analytics':
        hasPermission = permissions.canViewAnalytics;
        break;
      case 'export_reports':
        hasPermission = permissions.canExportReports;
        break;
      default:
        this.logger.warn(`Unknown permission: ${requiredPermission}`);
        hasPermission = false;
    }

    if (!hasPermission) {
      this.logger.warn(
        `User ${user.sub} denied access to ${requiredPermission} for org ${orgId}`,
      );
      throw new ForbiddenException('Insufficient permissions');
    }

    // Attach permissions to request for use in controller
    request.orgPermissions = permissions;

    return true;
  }
}
