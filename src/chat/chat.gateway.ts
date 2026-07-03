import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MuteChatDto, MarkReadDto } from './dto/chat-group.dto';

interface AuthedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' }, // tighten to your actual app origins in production
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    // Reuse the same auth pipeline as the HTTP JwtAuthGuard so socket
    // connections accept the exact same access tokens (custom `{ userId }`
    // tokens as well as Cognito JWTs).
    private readonly authService: AuthService,
  ) {}

  async handleConnection(client: AuthedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) throw new Error('No token provided');

      // Returns the full DB User (throws if invalid/expired).
      const user = await this.authService.validateAccessToken(token);
      if (!user) throw new Error('Invalid token');
      client.userId = user.id;

      const groupIds = await this.chatService.getGroupIdsForUser(client.userId);
      for (const groupId of groupIds) {
        client.join(this.roomName(groupId));
      }

      this.logger.log(`Client connected: user=${client.userId}, rooms=${groupIds.length}`);
    } catch (err) {
      this.logger.warn(`Rejected socket connection: ${err.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthedSocket) {
    this.logger.log(`Client disconnected: user=${client.userId}`);
  }

  @SubscribeMessage('sendMessage')
  async onSendMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() dto: SendMessageDto,
  ) {
    if (!client.userId) return;

    const result = await this.chatService.sendMessage({
      chatGroupId: dto.chatGroupId,
      senderId: client.userId,
      type: dto.type,
      text: dto.text,
      mediaUrl: dto.mediaUrl,
    });

    if (result.blocked) {
      // Only tell the sender — nobody else in the room ever sees a blocked message.
      client.emit('messageBlocked', {
        messageId: result.message.id,
        reason: 'This message was removed for violating community guidelines.',
      });
      return;
    }

    // Broadcast to everyone in the room (including sender, for multi-device sync)
    this.server.to(this.roomName(dto.chatGroupId)).emit('newMessage', {
      id: result.message.id,
      chatGroupId: dto.chatGroupId,
      senderId: client.userId,
      type: result.message.type,
      text: result.plaintext,
      mediaUrl: result.message.mediaUrl,
      createdAt: result.message.createdAt,
    });

    // NOTE: push-notification fan-out for offline/backgrounded recipients
    // happens outside the socket layer — see PushNotificationHook below,
    // called from wherever your existing push pipeline lives. This gateway
    // only handles participants who are actively connected.
  }

  @SubscribeMessage('muteChat')
  async onMuteChat(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() dto: MuteChatDto,
  ) {
    if (!client.userId) return;
    await this.chatService.setMute(dto.chatGroupId, client.userId, dto.muted);
    client.emit('muteUpdated', { chatGroupId: dto.chatGroupId, muted: dto.muted });
  }

  @SubscribeMessage('markRead')
  async onMarkRead(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() dto: MarkReadDto,
  ) {
    if (!client.userId) return;
    await this.chatService.markRead(dto.chatGroupId, client.userId);
  }

  private roomName(chatGroupId: string) {
    return `chat:${chatGroupId}`;
  }
}
