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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const wallet_service_1 = require("./wallet.service");
const cache_service_1 = require("../cache/cache.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let WalletController = class WalletController {
    walletService;
    prisma;
    cache;
    constructor(walletService, prisma, cache) {
        this.walletService = walletService;
        this.prisma = prisma;
        this.cache = cache;
    }
    async getMyWallet(req) {
        return this.walletService.getWallet(req.user.id);
    }
    async getMyTransactions(req, page = 1, limit = 20) {
        return this.walletService.getTransactions(req.user.id, +page, +limit);
    }
    async redeemCode(req, dto) {
        return this.walletService.redeemCode(req.user.id, dto.code);
    }
    async adminGrantCoins(req, dto) {
        return this.walletService.adminGrantCoins(dto, req.user.id);
    }
    async getUserWallet(userId) {
        return this.walletService.getWallet(userId);
    }
    async getAllRedeemCodes(page = 1, limit = 20) {
        return this.walletService.getAllRedeemCodes(+page, +limit);
    }
    async createRedeemCode(req, dto) {
        return this.walletService.createRedeemCode(dto, req.user.id);
    }
    async updateRedeemCode(id, dto) {
        return this.walletService.updateRedeemCode(id, dto);
    }
    async deleteRedeemCode(id) {
        return this.walletService.deleteRedeemCode(id);
    }
    async partnerRedeem(apiKey, dto) {
        if (!apiKey) {
            throw new common_1.UnauthorizedException('API key required');
        }
        const cachedPartner = await this.cache.validatePartnerApiKey(apiKey);
        let partner = cachedPartner;
        if (!partner) {
            partner = await this.prisma.partner.findUnique({
                where: { apiKey },
            });
            if (partner && partner.isActive) {
                await this.cache.setPartnerApiKey(apiKey, partner);
            }
        }
        if (!partner || !partner.isActive) {
            throw new common_1.UnauthorizedException('Invalid API key');
        }
        return this.walletService.partnerRedeemCoins(dto, partner.id);
    }
    async validateUser(apiKey, userId) {
        if (!apiKey) {
            throw new common_1.UnauthorizedException('API key required');
        }
        const cachedPartner = await this.cache.validatePartnerApiKey(apiKey);
        let partner = cachedPartner;
        if (!partner) {
            partner = await this.prisma.partner.findUnique({
                where: { apiKey },
            });
            if (partner && partner.isActive) {
                await this.cache.setPartnerApiKey(apiKey, partner);
            }
        }
        if (!partner || !partner.isActive) {
            throw new common_1.UnauthorizedException('Invalid API key');
        }
        return this.walletService.validateUser(userId);
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get my wallet balance and stats' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.WalletResponseDto }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getMyWallet", null);
__decorate([
    (0, common_1.Get)('transactions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get my transaction history' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [dto_1.WalletTransactionResponseDto] }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getMyTransactions", null);
__decorate([
    (0, common_1.Post)('redeem'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Redeem a code for coins' }),
    (0, swagger_1.ApiResponse)({ status: 201 }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.RedeemCodeDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "redeemCode", null);
__decorate([
    (0, common_1.Post)('admin/grant'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Grant coins to a user (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201 }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.AdminGrantCoinsDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "adminGrantCoins", null);
__decorate([
    (0, common_1.Get)('admin/users/:userId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get user wallet (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getUserWallet", null);
__decorate([
    (0, common_1.Get)('admin/redeem-codes'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'List all redeem codes (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getAllRedeemCodes", null);
__decorate([
    (0, common_1.Post)('admin/redeem-codes'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create redeem code (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201 }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateRedeemCodeDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "createRedeemCode", null);
__decorate([
    (0, common_1.Patch)('admin/redeem-codes/:id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update redeem code (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateRedeemCodeDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "updateRedeemCode", null);
__decorate([
    (0, common_1.Delete)('admin/redeem-codes/:id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate redeem code (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "deleteRedeemCode", null);
__decorate([
    (0, common_1.Post)('partners/redeem'),
    (0, swagger_1.ApiSecurity)('X-API-Key'),
    (0, swagger_1.ApiOperation)({ summary: 'Partner redeem coins (API key auth)' }),
    (0, swagger_1.ApiResponse)({ status: 201 }),
    __param(0, (0, common_1.Headers)('x-api-key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.PartnerRedeemDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "partnerRedeem", null);
__decorate([
    (0, common_1.Get)('partners/validate/:userId'),
    (0, swagger_1.ApiSecurity)('X-API-Key'),
    (0, swagger_1.ApiOperation)({ summary: 'Validate user exists (API key auth)' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, common_1.Headers)('x-api-key')),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "validateUser", null);
exports.WalletController = WalletController = __decorate([
    (0, swagger_1.ApiTags)('Wallet'),
    (0, common_1.Controller)('wallet'),
    __metadata("design:paramtypes", [wallet_service_1.WalletService,
        prisma_service_1.PrismaService,
        cache_service_1.CacheService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map