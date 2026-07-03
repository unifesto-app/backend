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
var AdminController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let AdminController = AdminController_1 = class AdminController {
    adminService;
    logger = new common_1.Logger(AdminController_1.name);
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getHealth() {
        this.logger.log('Health check endpoint called');
        return this.adminService.getHealthStatus();
    }
    async getAnalyticsOverview() {
        return this.adminService.getAnalyticsOverview();
    }
    async getAllEvents(page, limit, status, search) {
        return this.adminService.getAllEvents({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            status,
            search,
        });
    }
    async getLogs(lines, search) {
        return this.adminService.getPm2Logs({
            lines: lines ? parseInt(lines, 10) : 200,
            search,
        });
    }
    async registerDeviceToken(user, body) {
        return this.adminService.registerDeviceToken(user.id, body.fcmToken, body.platform || 'ios');
    }
    async unregisterDeviceToken(user, body) {
        return this.adminService.unregisterDeviceToken(user.id, body.fcmToken);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('health'),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('analytics/overview'),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAnalyticsOverview", null);
__decorate([
    (0, common_1.Get)('events'),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllEvents", null);
__decorate([
    (0, common_1.Get)('logs'),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    __param(0, (0, common_1.Query)('lines')),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getLogs", null);
__decorate([
    (0, common_1.Post)('device-token'),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "registerDeviceToken", null);
__decorate([
    (0, common_1.Delete)('device-token'),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "unregisterDeviceToken", null);
exports.AdminController = AdminController = AdminController_1 = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map