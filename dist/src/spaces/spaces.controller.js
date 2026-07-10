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
exports.SpacesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const spaces_service_1 = require("./spaces.service");
const guards_1 = require("../auth/guards");
const decorators_1 = require("../auth/decorators");
const dto_1 = require("./dto");
const create_space_request_dto_1 = require("./dto/create-space-request.dto");
const sub_space_request_dto_1 = require("./dto/sub-space-request.dto");
const client_1 = require("@prisma/client");
let SpacesController = class SpacesController {
    spacesService;
    constructor(spacesService) {
        this.spacesService = spacesService;
    }
    async createSpace(dto, user) {
        return this.spacesService.createSpace(dto, user.id);
    }
    async getAllSpaces(page, limit, status, visibility, search, parentId) {
        return this.spacesService.getAllSpaces({
            parentId,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 10,
            status,
            visibility,
            search,
        });
    }
    async getSpaceBySlug(slug) {
        return this.spacesService.getSpaceBySlug(slug);
    }
    async getAllSpaceRequests(status) {
        return this.spacesService.getAllSpaceRequests(status);
    }
    async getMySpaceRequests(user) {
        return this.spacesService.getMySpaceRequests(user.id);
    }
    async approveSpaceRequest(id, user) {
        return this.spacesService.approveSpaceRequest(id, user.id);
    }
    async rejectSpaceRequest(id, body, user) {
        return this.spacesService.rejectSpaceRequest(id, user.id, body?.reviewNote);
    }
    async createSpaceStatusRequest(user, dto) {
        return this.spacesService.createSpaceStatusRequest(user.id, dto);
    }
    async getMySpaceStatusRequests(user, spaceId) {
        return this.spacesService.getMySpaceStatusRequests(user.id, spaceId);
    }
    async getAllSpaceStatusRequests(status, page = 1, limit = 20) {
        return this.spacesService.getAllSpaceStatusRequests(status, +page, +limit);
    }
    async reviewSpaceStatusRequest(user, id, dto) {
        return this.spacesService.reviewSpaceStatusRequest(id, user.id, dto);
    }
    async createSubSpaceRequest(user, dto) {
        return this.spacesService.createSubSpaceRequest(user.id, dto);
    }
    async getMySubSpaceRequests(user) {
        return this.spacesService.getMySubSpaceRequests(user.id);
    }
    async getAllSubSpaceRequests(status, page = 1, limit = 20) {
        return this.spacesService.getAllSubSpaceRequests(status, +page, +limit);
    }
    async reviewSubSpaceRequest(user, id, dto) {
        return this.spacesService.reviewSubSpaceRequest(id, user.id, dto);
    }
    async getSpaceById(id, auth) {
        let userId;
        if (auth?.startsWith('Bearer ')) {
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.decode(auth.replace('Bearer ', ''));
                userId = decoded?.userId ?? decoded?.sub;
            }
            catch { }
        }
        return this.spacesService.getSpaceById(id, userId);
    }
    async joinSpace(id, user) {
        return this.spacesService.joinSpace(id, user.id);
    }
    async leaveSpace(id, user) {
        return this.spacesService.leaveSpace(id, user.id);
    }
    async updateSpace(id, dto) {
        return this.spacesService.updateSpace(id, dto);
    }
    async updateSpaceStatus(id, dto, user) {
        return this.spacesService.updateSpaceStatus(id, dto, user.id);
    }
    async deleteSpace(id) {
        return this.spacesService.deleteSpace(id);
    }
    async uploadLogo(id, file) {
        return this.spacesService.uploadLogo(id, file);
    }
    async uploadBanner(id, file) {
        return this.spacesService.uploadBanner(id, file);
    }
    async getSpaceMembers(id, page, limit, search, role) {
        return this.spacesService.getSpaceMembers(id, {
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            search,
            roleCode: role,
        });
    }
    async searchAddableUsers(id, q) {
        return this.spacesService.searchAddableUsers(id, q);
    }
    async addSpaceMember(id, dto, user) {
        return this.spacesService.addSpaceMember(id, user.id, dto.userId, dto.role);
    }
    async updateSpaceMemberRole(id, userRoleId, dto, user) {
        return this.spacesService.updateSpaceMemberRole(id, userRoleId, user.id, dto.role);
    }
    async removeSpaceMember(id, userRoleId, user) {
        return this.spacesService.removeSpaceMember(id, userRoleId, user.id);
    }
    async createSpaceRequest(dto, user) {
        return this.spacesService.createSpaceRequest(user.id, dto);
    }
};
exports.SpacesController = SpacesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.RoleCode.ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateSpaceDto, Object]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "createSpace", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('visibility')),
    __param(4, (0, common_1.Query)('search')),
    __param(5, (0, common_1.Query)('parentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "getAllSpaces", null);
__decorate([
    (0, common_1.Get)('slug/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "getSpaceBySlug", null);
__decorate([
    (0, common_1.Get)('requests'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.RoleCode.ADMIN),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "getAllSpaceRequests", null);
__decorate([
    (0, common_1.Get)('my-requests'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "getMySpaceRequests", null);
__decorate([
    (0, common_1.Patch)('requests/:id/approve'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.RoleCode.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "approveSpaceRequest", null);
__decorate([
    (0, common_1.Patch)('requests/:id/reject'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.RoleCode.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "rejectSpaceRequest", null);
__decorate([
    (0, common_1.Post)('status-requests'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateSpaceStatusRequestDto]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "createSpaceStatusRequest", null);
__decorate([
    (0, common_1.Get)('status-requests/my'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('spaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "getMySpaceStatusRequests", null);
__decorate([
    (0, common_1.Get)('status-requests'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.RoleCode.ADMIN),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "getAllSpaceStatusRequests", null);
__decorate([
    (0, common_1.Patch)('status-requests/:id/review'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.RoleCode.ADMIN),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.ReviewSpaceStatusRequestDto]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "reviewSpaceStatusRequest", null);
__decorate([
    (0, common_1.Post)('sub-space-requests'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, sub_space_request_dto_1.CreateSubSpaceRequestDto]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "createSubSpaceRequest", null);
__decorate([
    (0, common_1.Get)('sub-space-requests/mine'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "getMySubSpaceRequests", null);
__decorate([
    (0, common_1.Get)('sub-space-requests'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.RoleCode.ADMIN),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "getAllSubSpaceRequests", null);
__decorate([
    (0, common_1.Patch)('sub-space-requests/:id/review'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.RoleCode.ADMIN),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, sub_space_request_dto_1.ReviewSubSpaceRequestDto]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "reviewSubSpaceRequest", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "getSpaceById", null);
__decorate([
    (0, common_1.Post)(':id/join'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "joinSpace", null);
__decorate([
    (0, common_1.Post)(':id/leave'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "leaveSpace", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.SpaceRoleGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateSpaceDto]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "updateSpace", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.RoleCode.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateSpaceStatusDto, Object]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "updateSpaceStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.RoleCode.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "deleteSpace", null);
__decorate([
    (0, common_1.Post)(':id/logo'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.RoleCode.ADMIN),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('logo')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)(new common_1.ParseFilePipe({
        validators: [
            new common_1.MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
            new common_1.FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
    }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "uploadLogo", null);
__decorate([
    (0, common_1.Post)(':id/banner'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.RoleCode.ADMIN),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('banner')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)(new common_1.ParseFilePipe({
        validators: [
            new common_1.MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
            new common_1.FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
    }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "uploadBanner", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.SpaceRoleGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "getSpaceMembers", null);
__decorate([
    (0, common_1.Get)(':id/member-search'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.SpaceRoleGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "searchAddableUsers", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.SpaceRoleGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AddSpaceMemberDto, Object]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "addSpaceMember", null);
__decorate([
    (0, common_1.Patch)(':id/members/:userRoleId'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.SpaceRoleGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userRoleId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateSpaceMemberRoleDto, Object]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "updateSpaceMemberRole", null);
__decorate([
    (0, common_1.Delete)(':id/members/:userRoleId'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.SpaceRoleGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userRoleId')),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "removeSpaceMember", null);
__decorate([
    (0, common_1.Post)('request'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_space_request_dto_1.CreateSpaceRequestDto, Object]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "createSpaceRequest", null);
exports.SpacesController = SpacesController = __decorate([
    (0, common_1.Controller)('spaces'),
    __metadata("design:paramtypes", [spaces_service_1.SpacesService])
], SpacesController);
//# sourceMappingURL=spaces.controller.js.map