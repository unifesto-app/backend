import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ChatMessageType } from '@prisma/client';

export class SendMessageDto {
  @IsUUID()
  chatGroupId: string;

  @IsEnum(ChatMessageType)
  type: ChatMessageType;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  text?: string; // required when type = TEXT

  @IsOptional()
  @IsString()
  mediaUrl?: string; // S3 key, required when type = IMAGE
}
