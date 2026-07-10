import { PrismaService } from '../prisma/prisma.service';
import { AssignRoleDto } from './dto';
import { Role, UserRole, RoleCode, RoleScope } from '@prisma/client';
export interface UserRoleDetails {
    id: string;
    roleId: string;
    roleCode: RoleCode;
    roleName: string;
    roleScope: RoleScope;
    spaceId: string | null;
    eventId: string | null;
    assignedAt: Date;
}
export declare class RolesService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getAllRoles(): Promise<Role[]>;
    getUserRoles(userId: string): Promise<UserRoleDetails[]>;
    assignRole(dto: AssignRoleDto, assignedBy: string): Promise<UserRole>;
    removeRole(userRoleId: string): Promise<{
        message: string;
    }>;
    hasRole(userId: string, roleCode: RoleCode, spaceId?: string): Promise<boolean>;
    isAdmin(userId: string): Promise<boolean>;
    getUserRolesForSpace(userId: string, spaceId: string): Promise<UserRoleDetails[]>;
}
