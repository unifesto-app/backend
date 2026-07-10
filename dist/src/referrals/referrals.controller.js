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
exports.ReferralsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const referrals_service_1 = require("./referrals.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
class ApplyReferralDto {
    code;
}
__decorate([
    (0, swagger_2.ApiProperty)({ example: 'ABC12345' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApplyReferralDto.prototype, "code", void 0);
let ReferralsController = class ReferralsController {
    referralsService;
    constructor(referralsService) {
        this.referralsService = referralsService;
    }
    async getMyReferralStats(req) {
        return this.referralsService.getMyReferralStats(req.user.id);
    }
    async applyReferralCode(req, dto) {
        return this.referralsService.applyReferralCode(req.user.id, dto.code);
    }
    async getAllReferrals(page = 1, limit = 20) {
        return this.referralsService.getAllReferrals(+page, +limit);
    }
};
exports.ReferralsController = ReferralsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get my referral code and stats' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReferralsController.prototype, "getMyReferralStats", null);
__decorate([
    (0, common_1.Post)('apply'),
    (0, swagger_1.ApiOperation)({ summary: 'Apply a referral code (one-time only)' }),
    (0, swagger_1.ApiResponse)({ status: 201 }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ApplyReferralDto]),
    __metadata("design:returntype", Promise)
], ReferralsController.prototype, "applyReferralCode", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all referrals (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReferralsController.prototype, "getAllReferrals", null);
exports.ReferralsController = ReferralsController = __decorate([
    (0, swagger_1.ApiTags)('Referrals'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('referral'),
    __metadata("design:paramtypes", [referrals_service_1.ReferralsService])
], ReferralsController);
//# sourceMappingURL=referrals.controller.js.map