import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ApproveEventDto } from './dto/approve-event.dto';
import { RejectEventDto } from './dto/reject-event.dto';
import { EventQueryDto } from './dto/event-query.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../permissions/decorators/current-user.decorator';
import type { RequestUser } from '../auth/interfaces/user.interface';

@Controller('events')
@UseGuards(SupabaseAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async findAll(@CurrentUser() user: RequestUser, @Query() query: EventQueryDto) {
    return this.eventsService.findAll(user.sub, query);
  }

  @Get('pending')
  async getPendingEvents(
    @CurrentUser() user: RequestUser,
    @Query('organization_id') organizationId?: string,
  ) {
    return this.eventsService.getPendingEvents(user.sub, organizationId);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.eventsService.findOne(user.sub, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: RequestUser,
    @Body() createDto: CreateEventDto,
  ) {
    return this.eventsService.create(user.sub, createDto);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateEventDto,
  ) {
    return this.eventsService.update(user.sub, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.eventsService.remove(user.sub, id);
  }

  @Post(':id/submit-for-approval')
  @HttpCode(HttpStatus.OK)
  async submitForApproval(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.eventsService.submitForApproval(user.sub, id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approve(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() approveDto: ApproveEventDto,
  ) {
    return this.eventsService.approve(user.sub, id, approveDto);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() rejectDto: RejectEventDto,
  ) {
    return this.eventsService.reject(user.sub, id, rejectDto);
  }

  @Get(':id/approval-history')
  async getApprovalHistory(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.eventsService.getApprovalHistory(user.sub, id);
  }
}
