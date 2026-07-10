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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const chat_service_1 = require("./chat.service");
const chat_group_dto_1 = require("./dto/chat-group.dto");
const resolve_moderation_flag_dto_1 = require("./dto/resolve-moderation-flag.dto");
let ChatController = class ChatController {
    chatService;
    constructor(chatService) {
        this.chatService = chatService;
    }
    async listGroups(req) {
        return this.chatService.listGroupsForUser(req.user.id);
    }
    async getMessages(req, chatGroupId, cursor, limit) {
        return this.chatService.getMessages(chatGroupId, req.user.id, cursor, limit ? parseInt(limit, 10) : undefined);
    }
    async markRead(req, chatGroupId) {
        return this.chatService.markRead(chatGroupId, req.user.id);
    }
    async setMute(req, dto) {
        return this.chatService.setMute(dto.chatGroupId, req.user.id, dto.muted);
    }
    async listModerationFlags(status, page, limit) {
        return this.chatService.listModerationFlags(status || 'PENDING', page ? parseInt(page, 10) : undefined, limit ? parseInt(limit, 10) : undefined);
    }
    async resolveModerationFlag(req, flagId, dto) {
        return this.chatService.resolveModerationFlag(flagId, req.user.id, dto.actionType, dto.notes);
    }
    async uploadImage(req, chatGroupId, file) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        return this.chatService.uploadChatImage(chatGroupId, req.user.id, file);
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Get)('groups'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "listGroups", null);
__decorate([
    (0, common_1.Get)('groups/:id/messages'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('cursor')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Patch)('groups/:id/read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "markRead", null);
__decorate([
    (0, common_1.Patch)('mute'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, chat_group_dto_1.MuteChatDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "setMute", null);
__decorate([
    (0, common_1.Get)('admin/moderation/flags'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "listModerationFlags", null);
__decorate([
    (0, common_1.Patch)('admin/moderation/flags/:id/resolve'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.RoleCode.ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, resolve_moderation_flag_dto_1.ResolveModerationFlagDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "resolveModerationFlag", null);
__decorate([
    (0, common_1.Post)('groups/:id/upload-image'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "uploadImage", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map