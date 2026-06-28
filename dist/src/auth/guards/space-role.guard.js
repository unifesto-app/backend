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
var SpaceRoleGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpaceRoleGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let SpaceRoleGuard = class SpaceRoleGuard {
    static { SpaceRoleGuard_1 = this; }
    prisma;
    static ALLOWED = [
        client_1.RoleCode.ORGANISER,
        client_1.RoleCode.CO_ORGANISER,
        client_1.RoleCode.SUPER_ORGANISER,
    ];
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('User not authenticated');
        }
        const spaceId = request.params?.id ?? request.params?.spaceId;
        if (!spaceId) {
            throw new common_1.ForbiddenException('Space id not provided');
        }
        const userRoles = await this.prisma.userRole.findMany({
            where: { userId: user.id },
            include: { role: true },
        });
        const isAdmin = userRoles.some((ur) => ur.role.code === client_1.RoleCode.ADMIN);
        if (isAdmin) {
            return true;
        }
        const hasSpaceRole = userRoles.some((ur) => ur.spaceId === spaceId &&
            SpaceRoleGuard_1.ALLOWED.includes(ur.role.code));
        if (!hasSpaceRole) {
            throw new common_1.ForbiddenException('You do not have permission to manage this space');
        }
        return true;
    }
};
exports.SpaceRoleGuard = SpaceRoleGuard;
exports.SpaceRoleGuard = SpaceRoleGuard = SpaceRoleGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SpaceRoleGuard);
//# sourceMappingURL=space-role.guard.js.map