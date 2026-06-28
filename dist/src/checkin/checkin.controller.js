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
exports.CheckinController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const checkin_service_1 = require("./checkin.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let CheckinController = class CheckinController {
    checkinService;
    constructor(checkinService) {
        this.checkinService = checkinService;
    }
    async scanQRCode(req, dto) {
        return this.checkinService.scanQRCode(req.user.id, dto.qrCode);
    }
    async getEventRegistrationsForOffline(req, id) {
        return this.checkinService.getEventRegistrationsForOffline(req.user.id, id);
    }
    async getCheckinStats(req, id) {
        return this.checkinService.getCheckinStats(req.user.id, id);
    }
    async bulkCheckin(req, id, dto) {
        return this.checkinService.bulkCheckin(req.user.id, id, dto.registrationIds);
    }
};
exports.CheckinController = CheckinController;
__decorate([
    (0, common_1.Post)('scan'),
    (0, swagger_1.ApiOperation)({ summary: 'Scan QR code to check in attendee' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ScanQRCodeDto]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "scanQRCode", null);
__decorate([
    (0, common_1.Get)('event/:id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all registrations for offline caching (organiser only)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "getEventRegistrationsForOffline", null);
__decorate([
    (0, common_1.Get)('event/:id/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get live check-in stats (organiser only)' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "getCheckinStats", null);
__decorate([
    (0, common_1.Post)('event/:id/bulk'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk check-in by registration IDs' }),
    (0, swagger_1.ApiResponse)({ status: 201 }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.BulkCheckinDto]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "bulkCheckin", null);
exports.CheckinController = CheckinController = __decorate([
    (0, swagger_1.ApiTags)('Check-in'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('checkin'),
    __metadata("design:paramtypes", [checkin_service_1.CheckinService])
], CheckinController);
//# sourceMappingURL=checkin.controller.js.map