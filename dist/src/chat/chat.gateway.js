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
var ChatGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const auth_service_1 = require("../auth/auth.service");
const chat_service_1 = require("./chat.service");
const send_message_dto_1 = require("./dto/send-message.dto");
const chat_group_dto_1 = require("./dto/chat-group.dto");
let ChatGateway = ChatGateway_1 = class ChatGateway {
    chatService;
    authService;
    server;
    logger = new common_1.Logger(ChatGateway_1.name);
    constructor(chatService, authService) {
        this.chatService = chatService;
        this.authService = authService;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token)
                throw new Error('No token provided');
            const user = await this.authService.validateAccessToken(token);
            if (!user)
                throw new Error('Invalid token');
            client.userId = user.id;
            const groupIds = await this.chatService.getGroupIdsForUser(client.userId);
            for (const groupId of groupIds) {
                client.join(this.roomName(groupId));
            }
            this.logger.log(`Client connected: user=${client.userId}, rooms=${groupIds.length}`);
        }
        catch (err) {
            this.logger.warn(`Rejected socket connection: ${err.message}`);
            client.disconnect(true);
        }
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: user=${client.userId}`);
    }
    async onSendMessage(client, dto) {
        if (!client.userId)
            return;
        const result = await this.chatService.sendMessage({
            chatGroupId: dto.chatGroupId,
            senderId: client.userId,
            type: dto.type,
            text: dto.text,
            mediaUrl: dto.mediaUrl,
        });
        if (result.blocked) {
            client.emit('messageBlocked', {
                messageId: result.message.id,
                reason: 'This message was removed for violating community guidelines.',
            });
            return;
        }
        this.server.to(this.roomName(dto.chatGroupId)).emit('newMessage', {
            id: result.message.id,
            chatGroupId: dto.chatGroupId,
            senderId: client.userId,
            type: result.message.type,
            text: result.plaintext,
            mediaUrl: result.message.mediaUrl,
            createdAt: result.message.createdAt,
        });
    }
    async onMuteChat(client, dto) {
        if (!client.userId)
            return;
        await this.chatService.setMute(dto.chatGroupId, client.userId, dto.muted);
        client.emit('muteUpdated', { chatGroupId: dto.chatGroupId, muted: dto.muted });
    }
    async onMarkRead(client, dto) {
        if (!client.userId)
            return;
        await this.chatService.markRead(dto.chatGroupId, client.userId);
    }
    roomName(chatGroupId) {
        return `chat:${chatGroupId}`;
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, send_message_dto_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "onSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('muteChat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, chat_group_dto_1.MuteChatDto]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "onMuteChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('markRead'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, chat_group_dto_1.MarkReadDto]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "onMarkRead", null);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/chat',
        cors: { origin: '*' },
    }),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        auth_service_1.AuthService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map