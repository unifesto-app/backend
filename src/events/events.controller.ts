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
import { EventAccessService } from './event-access.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ApproveEventDto } from './dto/approve-event.dto';
import { RejectEventDto } from './dto/reject-event.dto';
import { EventQueryDto } from './dto/event-query.dto';
import { GrantAccessDto } from './dto/grant-access.dto';
import { RequestAccessDto } from './dto/request-access.dto';
import { ProcessAccessRequestDto } from './dto/process-access-request.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../permissions/decorators/current-user.decorator';
import type { RequestUser } from '../auth/interfaces/user.interface';

@Controller('events')
@UseGuards(SupabaseAuthGuard)
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly eventAccessService: EventAccessService,
  ) {}

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

  // ==========================================
  // EVENT ACCESS MANAGEMENT ENDPOINTS
  // ==========================================

  /**
   * Get user's permissions for an event
   */
  @Get(':id/permissions')
  async getEventPermissions(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.eventAccessService.getUserEventPermissions(user.sub, id);
  }

  /**
   * Get all collaborators for an event
   */
  @Get(':id/collaborators')
  async getCollaborators(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.eventAccessService.getEventCollaborators(user.sub, id);
  }

  /**
   * Grant access to a user
   */
  @Post(':id/collaborators')
  @HttpCode(HttpStatus.CREATED)
  async grantAccess(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() grantDto: GrantAccessDto,
  ) {
    return this.eventAccessService.grantAccess(user.sub, id, grantDto);
  }

  /**
   * Revoke access from a user
   */
  @Delete(':id/collaborators/:userId')
  async revokeAccess(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.eventAccessService.revokeAccess(user.sub, id, userId);
  }

  /**
   * Request access to an event
   */
  @Post(':id/access-requests')
  @HttpCode(HttpStatus.CREATED)
  async requestAccess(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() requestDto: RequestAccessDto,
  ) {
    return this.eventAccessService.requestAccess(user.sub, id, requestDto);
  }

  /**
   * Get access requests for an event
   */
  @Get(':id/access-requests')
  async getAccessRequests(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Query('status') status?: string,
  ) {
    return this.eventAccessService.getAccessRequests(user.sub, id, status);
  }

  /**
   * Process an access request (approve/reject)
   */
  @Patch('access-requests/:requestId')
  async processAccessRequest(
    @CurrentUser() user: RequestUser,
    @Param('requestId') requestId: string,
    @Body() processDto: ProcessAccessRequestDto,
  ) {
    return this.eventAccessService.processAccessRequest(
      user.sub,
      requestId,
      processDto,
    );
  }

  /**
   * Cancel an access request
   */
  @Delete('access-requests/:requestId')
  async cancelAccessRequest(
    @CurrentUser() user: RequestUser,
    @Param('requestId') requestId: string,
  ) {
    return this.eventAccessService.cancelAccessRequest(user.sub, requestId);
  }

  /**
   * Get access audit log for an event
   */
  @Get(':id/access-audit')
  async getAccessAuditLog(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.eventAccessService.getAccessAuditLog(user.sub, id);
  }
}
