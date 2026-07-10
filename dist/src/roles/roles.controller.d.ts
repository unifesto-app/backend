import { RolesService } from './roles.service';
import { AssignRoleDto } from './dto';
import type { User } from '@prisma/client';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    getAllRoles(): Promise<{
        id: string;
        code: import("@prisma/client").$Enums.RoleCode;
        name: string;
        scope: import("@prisma/client").$Enums.RoleScope;
        createdAt: Date;
    }[]>;
    getUserRoles(userId: string): Promise<import("./roles.service").UserRoleDetails[]>;
    assignRole(dto: AssignRoleDto, user: User): Promise<{
        id: string;
        createdAt: Date;
        spaceId: string | null;
        userId: string;
        roleId: string;
        eventId: string | null;
        assignedBy: string | null;
    }>;
    removeRole(userRoleId: string): Promise<{
        message: string;
    }>;
    checkRole(userId: string, roleCode: string): Promise<{
        hasRole: boolean;
    }>;
}
