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
exports.AdminEmailController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const admin_email_service_1 = require("./admin-email.service");
let AdminEmailController = class AdminEmailController {
    adminEmailService;
    constructor(adminEmailService) {
        this.adminEmailService = adminEmailService;
    }
    async sendToUser(user, dto) {
        return this.adminEmailService.sendToUser(user.id, dto);
    }
    async sendToSpace(user, dto) {
        return this.adminEmailService.sendToSpace(user.id, dto);
    }
    async sendToEvent(user, dto) {
        return this.adminEmailService.sendToEvent(user.id, dto);
    }
    async sendToAll(user, dto) {
        return this.adminEmailService.sendToAll(user.id, dto);
    }
    async sendToOrganisers(user, dto) {
        return this.adminEmailService.sendToOrganisers(user.id, dto);
    }
    async sendToWaitlist(user, dto) {
        return this.adminEmailService.sendToWaitlist(user.id, dto);
    }
    async sendToSegment(user, dto) {
        return this.adminEmailService.sendToSegment(user.id, dto);
    }
    async getCampaigns(page = '1', limit = '20') {
        return this.adminEmailService.getCampaigns(parseInt(page), parseInt(limit));
    }
    async getCampaignById(id) {
        return this.adminEmailService.getCampaignById(id);
    }
    async cancelCampaign(id) {
        return this.adminEmailService.cancelCampaign(id);
    }
};
exports.AdminEmailController = AdminEmailController;
__decorate([
    (0, common_1.Post)('send-to-user'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminEmailController.prototype, "sendToUser", null);
__decorate([
    (0, common_1.Post)('send-to-space'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminEmailController.prototype, "sendToSpace", null);
__decorate([
    (0, common_1.Post)('send-to-event'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminEmailController.prototype, "sendToEvent", null);
__decorate([
    (0, common_1.Post)('send-to-all'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminEmailController.prototype, "sendToAll", null);
__decorate([
    (0, common_1.Post)('send-to-organisers'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminEmailController.prototype, "sendToOrganisers", null);
__decorate([
    (0, common_1.Post)('send-to-waitlist'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminEmailController.prototype, "sendToWaitlist", null);
__decorate([
    (0, common_1.Post)('send-to-segment'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminEmailController.prototype, "sendToSegment", null);
__decorate([
    (0, common_1.Get)('campaigns'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminEmailController.prototype, "getCampaigns", null);
__decorate([
    (0, common_1.Get)('campaigns/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminEmailController.prototype, "getCampaignById", null);
__decorate([
    (0, common_1.Delete)('campaigns/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminEmailController.prototype, "cancelCampaign", null);
exports.AdminEmailController = AdminEmailController = __decorate([
    (0, common_1.Controller)('admin/email'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    __metadata("design:paramtypes", [admin_email_service_1.AdminEmailService])
], AdminEmailController);
//# sourceMappingURL=admin-email.controller.js.map