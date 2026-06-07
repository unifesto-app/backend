import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { RoleCode } from '@prisma/client';
import { AdminEmailService } from './admin-email.service';

@Controller('admin/email')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.ADMIN)
export class AdminEmailController {
  constructor(private readonly adminEmailService: AdminEmailService) {}

  @Post('send-to-user')
  async sendToUser(@CurrentUser() user: User, @Body() dto: any) {
    return this.adminEmailService.sendToUser(user.id, dto);
  }

  @Post('send-to-space')
  async sendToSpace(@CurrentUser() user: User, @Body() dto: any) {
    return this.adminEmailService.sendToSpace(user.id, dto);
  }

  @Post('send-to-event')
  async sendToEvent(@CurrentUser() user: User, @Body() dto: any) {
    return this.adminEmailService.sendToEvent(user.id, dto);
  }

  @Post('send-to-all')
  async sendToAll(@CurrentUser() user: User, @Body() dto: any) {
    return this.adminEmailService.sendToAll(user.id, dto);
  }

  @Post('send-to-organisers')
  async sendToOrganisers(@CurrentUser() user: User, @Body() dto: any) {
    return this.adminEmailService.sendToOrganisers(user.id, dto);
  }

  @Post('send-to-waitlist')
  async sendToWaitlist(@CurrentUser() user: User, @Body() dto: any) {
    return this.adminEmailService.sendToWaitlist(user.id, dto);
  }

  @Post('send-to-segment')
  async sendToSegment(@CurrentUser() user: User, @Body() dto: any) {
    return this.adminEmailService.sendToSegment(user.id, dto);
  }

  @Get('campaigns')
  async getCampaigns(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.adminEmailService.getCampaigns(parseInt(page), parseInt(limit));
  }

  @Get('campaigns/:id')
  async getCampaignById(@Param('id') id: string) {
    return this.adminEmailService.getCampaignById(id);
  }

  @Delete('campaigns/:id')
  async cancelCampaign(@Param('id') id: string) {
    return this.adminEmailService.cancelCampaign(id);
  }
}
