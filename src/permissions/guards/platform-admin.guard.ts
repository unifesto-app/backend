import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PermissionsService } from '../permissions.service';
import type { RequestUser } from '../../auth/interfaces/user.interface';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  private readonly logger = new Logger(PlatformAdminGuard.name);

  constructor(private readonly permissionsService: PermissionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: RequestUser = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const isPlatformAdmin = await this.permissionsService.isPlatformSuperAdmin(
      user.sub,
    );

    if (!isPlatformAdmin) {
      this.logger.warn(
        `User ${user.sub} attempted to access platform admin resource`,
      );
      throw new ForbiddenException('Platform admin access required');
    }

    return true;
  }
}
