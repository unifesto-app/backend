import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { RequestUser } from '../interfaces/user.interface';
import { UserRole } from '../interfaces/user.interface';
import { AuthService } from '../auth.service';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: RequestUser = request.user;

    if (!user) {
      this.logger.warn('RolesGuard: No user found in request');
      throw new ForbiddenException('User not authenticated');
    }

    try {
      // Fetch user profile to get the actual role from database
      const profile = await this.authService.getProfile(user.sub);

      // Check if user is banned or inactive
      if (profile.is_banned) {
        this.logger.warn(`Banned user attempted access: ${user.sub}`);
        throw new ForbiddenException('Account has been banned');
      }

      if (!profile.is_active) {
        this.logger.warn(`Inactive user attempted access: ${user.sub}`);
        throw new ForbiddenException('Account is inactive');
      }

      // Check if user has required role
      const hasRole = requiredRoles.includes(profile.role);

      if (!hasRole) {
        this.logger.warn(
          `User ${user.sub} with role ${profile.role} attempted to access resource requiring roles: ${requiredRoles.join(', ')}`,
        );
        throw new ForbiddenException('Insufficient permissions');
      }

      this.logger.debug(
        `User ${user.sub} authorized with role: ${profile.role}`,
      );
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Error in RolesGuard: ${error.message}`);
      throw new ForbiddenException('Authorization failed');
    }
  }
}
