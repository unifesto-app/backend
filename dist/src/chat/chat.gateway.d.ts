import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MuteChatDto, MarkReadDto } from './dto/chat-group.dto';
interface AuthedSocket extends Socket {
    userId?: string;
}
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatService;
    private readonly authService;
    server: Server;
    private readonly logger;
    constructor(chatService: ChatService, authService: AuthService);
    handleConnection(client: AuthedSocket): Promise<void>;
    handleDisconnect(client: AuthedSocket): void;
    onSendMessage(client: AuthedSocket, dto: SendMessageDto): Promise<void>;
    onMuteChat(client: AuthedSocket, dto: MuteChatDto): Promise<void>;
    onMarkRead(client: AuthedSocket, dto: MarkReadDto): Promise<void>;
    private roomName;
}
export {};
