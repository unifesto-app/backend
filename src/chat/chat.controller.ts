import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '@prisma/client';
import { ChatService } from './chat.service';
import { MuteChatDto } from './dto/chat-group.dto';
import { ResolveModerationFlagDto } from './dto/resolve-moderation-flag.dto';

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

  @Get('admin/moderation/flags')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN)
  async listModerationFlags(
    @Query('status') status?: 'PENDING' | 'RESOLVED',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.listModerationFlags(
      status || 'PENDING',
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Patch('admin/moderation/flags/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN)
  async resolveModerationFlag(
    @Req() req: any,
    @Param('id') flagId: string,
    @Body() dto: ResolveModerationFlagDto,
  ) {
    return this.chatService.resolveModerationFlag(
      flagId,
      req.user.id,
      dto.actionType,
      dto.notes,
    );
  }

  @Post('groups/:id/upload-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Req() req: any,
    @Param('id') chatGroupId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.chatService.uploadChatImage(chatGroupId, req.user.id, file);
  }
}
