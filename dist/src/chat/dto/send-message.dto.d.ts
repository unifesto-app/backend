import { ChatMessageType } from '@prisma/client';
export declare class SendMessageDto {
    chatGroupId: string;
    type: ChatMessageType;
    text?: string;
    mediaUrl?: string;
}
