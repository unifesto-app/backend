import { CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
export declare class SpaceRoleGuard implements CanActivate {
    private prisma;
    private static readonly ALLOWED;
    constructor(prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
