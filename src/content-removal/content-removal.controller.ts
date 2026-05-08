import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ContentRemovalService } from './content-removal.service';
import { CreateRemovalRequestDto } from './dto/create-removal-request.dto';
import { ProcessRemovalRequestDto } from './dto/process-removal-request.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../permissions/decorators/current-user.decorator';
import type { RequestUser } from '../auth/interfaces/user.interface';

@Controller('content-removal')
@UseGuards(SupabaseAuthGuard)
export class ContentRemovalController {
  constructor(private readonly contentRemovalService: ContentRemovalService) {}

  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  async createRequest(
    @CurrentUser() user: RequestUser,
    @Body() createDto: CreateRemovalRequestDto,
  ) {
    return this.contentRemovalService.createRequest(user.sub, createDto);
  }

  @Get('requests')
  async getRequests(
    @CurrentUser() user: RequestUser,
    @Query('organization_id') orgId?: string,
    @Query('status') status?: string,
  ) {
    return this.contentRemovalService.getRequests(user.sub, orgId, status);
  }

  @Patch('requests/:id')
  async processRequest(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() processDto: ProcessRemovalRequestDto,
  ) {
    return this.contentRemovalService.processRequest(user.sub, id, processDto);
  }
}
