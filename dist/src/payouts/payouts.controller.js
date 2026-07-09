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
exports.PayoutsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const payouts_service_1 = require("./payouts.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let PayoutsController = class PayoutsController {
    payoutsService;
    constructor(payoutsService) {
        this.payoutsService = payoutsService;
    }
    async addBankAccount(req, dto) {
        return this.payoutsService.addBankAccount(req.user.id, dto);
    }
    async getMyBankAccounts(req) {
        return this.payoutsService.getMyBankAccounts(req.user.id);
    }
    async deleteBankAccount(req, id) {
        return this.payoutsService.deleteBankAccount(req.user.id, id);
    }
    async getMyPayouts(req, page = 1, limit = 20) {
        return this.payoutsService.getPayoutsForOrganiser(req.user.id, +page, +limit);
    }
    async getEventPayoutSummary(req, eventId) {
        return this.payoutsService.getEventPayoutSummary(eventId, req.user.id);
    }
    async getAllBankAccounts(page = 1, limit = 20, status) {
        return this.payoutsService.getAllBankAccounts(+page, +limit, status);
    }
    async updateBankAccountStatus(req, id, dto) {
        return this.payoutsService.updateBankAccountStatus(id, dto, req.user.id);
    }
    async getAllPayouts(page = 1, limit = 20, status) {
        return this.payoutsService.getAllPayouts(+page, +limit, status);
    }
    async getAdminEventPayoutSummary(eventId) {
        return this.payoutsService.getEventPayoutSummary(eventId);
    }
    async createPayout(req, dto) {
        return this.payoutsService.createPayout(dto, req.user.id);
    }
    async processPayout(id) {
        return this.payoutsService.processPayoutTransfer(id);
    }
    async cancelPayout(req, id) {
        return this.payoutsService.cancelPayout(id, req.user.id);
    }
};
exports.PayoutsController = PayoutsController;
__decorate([
    (0, common_1.Post)('bank-accounts'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.AddBankAccountDto]),
    __metadata("design:returntype", Promise)
], PayoutsController.prototype, "addBankAccount", null);
__decorate([
    (0, common_1.Get)('bank-accounts'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PayoutsController.prototype, "getMyBankAccounts", null);
__decorate([
    (0, common_1.Delete)('bank-accounts/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PayoutsController.prototype, "deleteBankAccount", null);
__decorate([
    (0, common_1.Get)('my'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], PayoutsController.prototype, "getMyPayouts", null);
__decorate([
    (0, common_1.Get)('event/:eventId/summary'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PayoutsController.prototype, "getEventPayoutSummary", null);
__decorate([
    (0, common_1.Get)('admin/bank-accounts'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], PayoutsController.prototype, "getAllBankAccounts", null);
__decorate([
    (0, common_1.Patch)('admin/bank-accounts/:id/status'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.UpdateBankAccountStatusDto]),
    __metadata("design:returntype", Promise)
], PayoutsController.prototype, "updateBankAccountStatus", null);
__decorate([
    (0, common_1.Get)('admin'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], PayoutsController.prototype, "getAllPayouts", null);
__decorate([
    (0, common_1.Get)('admin/event/:eventId/summary'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    __param(0, (0, common_1.Param)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PayoutsController.prototype, "getAdminEventPayoutSummary", null);
__decorate([
    (0, common_1.Post)('admin'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreatePayoutDto]),
    __metadata("design:returntype", Promise)
], PayoutsController.prototype, "createPayout", null);
__decorate([
    (0, common_1.Post)('admin/:id/process'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PayoutsController.prototype, "processPayout", null);
__decorate([
    (0, common_1.Patch)('admin/:id/cancel'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PayoutsController.prototype, "cancelPayout", null);
exports.PayoutsController = PayoutsController = __decorate([
    (0, swagger_1.ApiTags)('Payouts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('payouts'),
    __metadata("design:paramtypes", [payouts_service_1.PayoutsService])
], PayoutsController);
//# sourceMappingURL=payouts.controller.js.map