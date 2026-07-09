import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleCode } from '@prisma/client';

/**
 * SpaceRoleGuard
 *
 * Allows access when the authenticated user is either:
 *   - a platform ADMIN, OR
 *   - holds an ORGANISER / CO_ORGANISER role scoped to the space whose
 *     id is provided as the `:id` (or `:spaceId`) route param.
 *
 * Use together with JwtAuthGuard:
 *   @UseGuards(JwtAuthGuard, SpaceRoleGuard)
 */
@Injectable()
export class SpaceRoleGuard implements CanActivate {
  private static readonly ALLOWED: RoleCode[] = [
    RoleCode.ORGANISER,
    RoleCode.CO_ORGANISER,
  ];

  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const spaceId: string | undefined =
      request.params?.id ?? request.params?.spaceId;

    if (!spaceId) {
      throw new ForbiddenException('Space id not provided');
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: true },
    });

    // Platform admin can do anything
    const isAdmin = userRoles.some((ur) => ur.role.code === RoleCode.ADMIN);
    if (isAdmin) {
      return true;
    }

    // Otherwise must hold an allowed role scoped to this space
    const hasSpaceRole = userRoles.some(
      (ur) =>
        ur.spaceId === spaceId &&
        SpaceRoleGuard.ALLOWED.includes(ur.role.code),
    );

    if (!hasSpaceRole) {
      throw new ForbiddenException(
        'You do not have permission to manage this space',
      );
    }

    return true;
  }
}
