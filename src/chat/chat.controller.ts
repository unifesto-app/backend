import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { MuteChatDto } from './dto/chat-group.dto';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('groups')
  async listGroups(@Req() req: any) {
    return this.chatService.listGroupsForUser(req.user.id);
  }

  @Get('groups/:id/messages')
  async getMessages(
    @Req() req: any,
    @Param('id') chatGroupId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(
      chatGroupId,
      req.user.id,
      cursor,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Patch('groups/:id/read')
  async markRead(@Req() req: any, @Param('id') chatGroupId: string) {
    return this.chatService.markRead(chatGroupId, req.user.id);
  }

  @Patch('mute')
  async setMute(@Req() req: any, @Body() dto: MuteChatDto) {
    return this.chatService.setMute(dto.chatGroupId, req.user.id, dto.muted);
  }
}
