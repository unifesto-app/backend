import { IsBoolean, IsUUID } from 'class-validator';

export class MuteChatDto {
  @IsUUID()
  chatGroupId: string;

  @IsBoolean()
  muted: boolean;
}

export class MarkReadDto {
  @IsUUID()
  chatGroupId: string;

  @IsUUID()
  upToMessageId: string;
}
