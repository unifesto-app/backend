"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../prisma/prisma.service");
const cache_service_1 = require("../cache/cache.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
let PartnersController = class PartnersController {
    prisma;
    cache;
    constructor(prisma, cache) {
        this.prisma = prisma;
        this.cache = cache;
    }
    async getAllPartners(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [partners, total] = await Promise.all([
            this.prisma.partner.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { transactions: true },
                    },
                },
            }),
            this.prisma.partner.count(),
        ]);
        return {
            data: partners,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async createPartner(dto) {
        const apiKey = crypto.randomBytes(32).toString('hex');
        return this.prisma.partner.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description,
                logoUrl: dto.logoUrl,
                websiteUrl: dto.websiteUrl,
                apiKey,
                maxCoinsPerTxn: dto.maxCoinsPerTxn,
            },
        });
    }
    async updatePartner(id, dto) {
        const oldPartner = await this.prisma.partner.findUnique({
            where: { id },
            select: { apiKey: true },
        });
        const updated = await this.prisma.partner.update({
            where: { id },
            data: {
                isActive: dto.isActive,
                maxCoinsPerTxn: dto.maxCoinsPerTxn,
                description: dto.description,
            },
        });
        if (oldPartner?.apiKey) {
            await this.cache.invalidatePartnerCache(oldPartner.apiKey);
        }
        return updated;
    }
    async regenerateApiKey(id) {
        const oldPartner = await this.prisma.partner.findUnique({
            where: { id },
            select: { apiKey: true },
        });
        const apiKey = crypto.randomBytes(32).toString('hex');
        const updated = await this.prisma.partner.update({
            where: { id },
            data: { apiKey },
            select: {
                id: true,
                name: true,
                apiKey: true,
            },
        });
        if (oldPartner?.apiKey) {
            await this.cache.invalidatePartnerCache(oldPartner.apiKey);
        }
        return updated;
    }
};
exports.PartnersController = PartnersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all partners (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PartnersController.prototype, "getAllPartners", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create partner (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreatePartnerDto]),
    __metadata("design:returntype", Promise)
], PartnersController.prototype, "createPartner", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update partner (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdatePartnerDto]),
    __metadata("design:returntype", Promise)
], PartnersController.prototype, "updatePartner", null);
__decorate([
    (0, common_1.Post)(':id/regenerate-key'),
    (0, swagger_1.ApiOperation)({ summary: 'Regenerate partner API key (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PartnersController.prototype, "regenerateApiKey", null);
exports.PartnersController = PartnersController = __decorate([
    (0, swagger_1.ApiTags)('Partners (Admin)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    (0, common_1.Controller)('admin/partners'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService])
], PartnersController);
//# sourceMappingURL=partners.controller.js.map