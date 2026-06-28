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
exports.DiscussionsController = void 0;
const common_1 = require("@nestjs/common");
const discussions_service_1 = require("./discussions.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
let DiscussionsController = class DiscussionsController {
    discussionsService;
    constructor(discussionsService) {
        this.discussionsService = discussionsService;
    }
    async getDiscussionsBySpace(spaceId, page, limit, pinned) {
        const pinnedBool = pinned === 'true' ? true : pinned === 'false' ? false : undefined;
        return this.discussionsService.getDiscussionsBySpace(spaceId, {
            page,
            limit,
            pinned: pinnedBool,
        });
    }
    async getDiscussionById(id) {
        return this.discussionsService.getDiscussionById(id);
    }
    async createDiscussion(dto, req) {
        return this.discussionsService.createDiscussion(dto, req.user.sub);
    }
    async updateDiscussion(id, dto, req) {
        return this.discussionsService.updateDiscussion(id, dto, req.user.sub);
    }
    async deleteDiscussion(id, req) {
        return this.discussionsService.deleteDiscussion(id, req.user.sub);
    }
    async togglePin(id, isPinned) {
        return this.discussionsService.togglePin(id, isPinned);
    }
    async toggleLock(id, isLocked) {
        return this.discussionsService.toggleLock(id, isLocked);
    }
    async createReply(dto, req) {
        return this.discussionsService.createReply(dto, req.user.sub);
    }
    async deleteReply(id, req) {
        return this.discussionsService.deleteReply(id, req.user.sub);
    }
};
exports.DiscussionsController = DiscussionsController;
__decorate([
    (0, common_1.Get)('space/:spaceId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get discussions by space ID' }),
    __param(0, (0, common_1.Param)('spaceId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('pinned')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, String]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "getDiscussionsBySpace", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get discussion by ID' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "getDiscussionById", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new discussion' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateDiscussionDto, Object]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "createDiscussion", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update discussion' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateDiscussionDto, Object]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "updateDiscussion", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete discussion' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "deleteDiscussion", null);
__decorate([
    (0, common_1.Patch)(':id/pin'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Pin/Unpin discussion (ADMIN)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)('isPinned', common_1.ParseBoolPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "togglePin", null);
__decorate([
    (0, common_1.Patch)(':id/lock'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Lock/Unlock discussion (ADMIN)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)('isLocked', common_1.ParseBoolPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "toggleLock", null);
__decorate([
    (0, common_1.Post)('replies'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a reply to discussion' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateReplyDto, Object]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "createReply", null);
__decorate([
    (0, common_1.Delete)('replies/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete reply' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "deleteReply", null);
exports.DiscussionsController = DiscussionsController = __decorate([
    (0, swagger_1.ApiTags)('Discussions'),
    (0, common_1.Controller)('discussions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [discussions_service_1.DiscussionsService])
], DiscussionsController);
//# sourceMappingURL=discussions.controller.js.map