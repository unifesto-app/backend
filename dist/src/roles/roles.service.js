"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RolesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let RolesService = RolesService_1 = class RolesService {
    prisma;
    logger = new common_1.Logger(RolesService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllRoles() {
        return this.prisma.role.findMany({
            orderBy: [{ scope: 'asc' }, { code: 'asc' }],
        });
    }
    async getUserRoles(userId) {
        const userRoles = await this.prisma.userRole.findMany({
            where: { userId },
            include: {
                role: true,
            },
            orderBy: [{ role: { scope: 'asc' } }, { role: { code: 'asc' } }],
        });
        return userRoles.map((ur) => ({
            id: ur.id,
            roleId: ur.role.id,
            roleCode: ur.role.code,
            roleName: ur.role.name,
            roleScope: ur.role.scope,
            spaceId: ur.spaceId,
            assignedAt: ur.createdAt,
        }));
    }
    async assignRole(dto, assignedBy) {
        const role = await this.prisma.role.findUnique({
            where: { id: dto.roleId },
        });
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        if (role.scope === client_1.RoleScope.PLATFORM && dto.spaceId) {
            throw new common_1.BadRequestException('Platform roles cannot have a space_id');
        }
        if (role.scope === client_1.RoleScope.SPACE && !dto.spaceId) {
            throw new common_1.BadRequestException('Space roles must have a space_id');
        }
        if (role.scope === client_1.RoleScope.SPACE && dto.spaceId) {
            const space = await this.prisma.space.findUnique({
                where: { id: dto.spaceId },
            });
            if (!space) {
                throw new common_1.NotFoundException('Space not found');
            }
            const currentRoleCount = await this.prisma.userRole.count({
                where: {
                    spaceId: dto.spaceId,
                    role: { code: role.code },
                },
            });
            if (role.code === client_1.RoleCode.SUPER_ORGANISER && currentRoleCount >= 1) {
                throw new common_1.BadRequestException('Space already has a Super Organiser. Only one Super Organiser is allowed per space.');
            }
            if (role.code === client_1.RoleCode.ORGANISER && currentRoleCount >= 1) {
                throw new common_1.BadRequestException('Space already has an Organiser. Only one Organiser is allowed per space.');
            }
            if (role.code === client_1.RoleCode.CO_ORGANISER &&
                currentRoleCount >= space.coOrganiserLimit) {
                throw new common_1.BadRequestException(`Space has reached the Co-Organiser limit of ${space.coOrganiserLimit}.`);
            }
        }
        const existing = await this.prisma.userRole.findFirst({
            where: {
                userId: dto.userId,
                roleId: dto.roleId,
                spaceId: dto.spaceId || null,
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Role already assigned to user');
        }
        const userRole = await this.prisma.userRole.create({
            data: {
                userId: dto.userId,
                roleId: dto.roleId,
                spaceId: dto.spaceId || undefined,
                assignedBy,
            },
        });
        return userRole;
    }
    async removeRole(userRoleId) {
        await this.prisma.userRole.delete({
            where: { id: userRoleId },
        });
        return { message: 'Role removed successfully' };
    }
    async hasRole(userId, roleCode, spaceId) {
        const where = {
            userId,
            role: {
                code: roleCode,
            },
        };
        if (spaceId) {
            where.spaceId = spaceId;
        }
        const userRole = await this.prisma.userRole.findFirst({
            where,
        });
        return !!userRole;
    }
    async isAdmin(userId) {
        return this.hasRole(userId, client_1.RoleCode.ADMIN);
    }
    async getUserRolesForSpace(userId, spaceId) {
        const userRoles = await this.prisma.userRole.findMany({
            where: {
                userId,
                OR: [
                    { spaceId },
                    { role: { scope: client_1.RoleScope.PLATFORM } },
                ],
            },
            include: {
                role: true,
            },
        });
        return userRoles.map((ur) => ({
            id: ur.id,
            roleId: ur.role.id,
            roleCode: ur.role.code,
            roleName: ur.role.name,
            roleScope: ur.role.scope,
            spaceId: ur.spaceId,
            assignedAt: ur.createdAt,
        }));
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = RolesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RolesService);
//# sourceMappingURL=roles.service.js.map