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
import { EventAdditionalInfoService } from './event-additional-info.service';
import { TicketsService } from './tickets.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ApproveEventDto } from './dto/approve-event.dto';
import { RejectEventDto } from './dto/reject-event.dto';
import { EventQueryDto } from './dto/event-query.dto';
import { GrantAccessDto } from './dto/grant-access.dto';
import { RequestAccessDto } from './dto/request-access.dto';
import { ProcessAccessRequestDto } from './dto/process-access-request.dto';
import { CreateAgendaItemDto, UpdateAgendaItemDto } from './dto/agenda.dto';
import { CreateSpeakerDto, UpdateSpeakerDto } from './dto/speaker.dto';
import { CreatePrizeDto, UpdatePrizeDto } from './dto/prize.dto';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateCustomFieldDto, UpdateCustomFieldDto } from './dto/custom-field.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../permissions/decorators/current-user.decorator';
import type { RequestUser } from '../auth/interfaces/user.interface';

@Controller('events')
@UseGuards(SupabaseAuthGuard)
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly eventAccessService: EventAccessService,
    private readonly additionalInfoService: EventAdditionalInfoService,
    private readonly ticketsService: TicketsService,
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

  // ==========================================
  // ADDITIONAL INFO ENDPOINTS
  // ==========================================

  /**
   * Get all additional info (agenda, speakers, prizes, faqs)
   */
  @Get(':id/additional-info')
  async getAllAdditionalInfo(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.additionalInfoService.getAllAdditionalInfo(id, true);
  }

  // AGENDA ENDPOINTS
  @Get(':id/agenda')
  async getAgenda(@Param('id') id: string) {
    return this.additionalInfoService.getAgenda(id);
  }

  @Post(':id/agenda')
  @HttpCode(HttpStatus.CREATED)
  async createAgendaItem(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateAgendaItemDto,
  ) {
    return this.additionalInfoService.createAgendaItem(user.sub, id, dto);
  }

  @Patch(':id/agenda/:itemId')
  async updateAgendaItem(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateAgendaItemDto,
  ) {
    return this.additionalInfoService.updateAgendaItem(user.sub, id, itemId, dto);
  }

  @Delete(':id/agenda/:itemId')
  async deleteAgendaItem(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.additionalInfoService.deleteAgendaItem(user.sub, id, itemId);
  }

  // SPEAKERS ENDPOINTS
  @Get(':id/speakers')
  async getSpeakers(@Param('id') id: string) {
    return this.additionalInfoService.getSpeakers(id);
  }

  @Post(':id/speakers')
  @HttpCode(HttpStatus.CREATED)
  async createSpeaker(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateSpeakerDto,
  ) {
    return this.additionalInfoService.createSpeaker(user.sub, id, dto);
  }

  @Patch(':id/speakers/:speakerId')
  async updateSpeaker(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('speakerId') speakerId: string,
    @Body() dto: UpdateSpeakerDto,
  ) {
    return this.additionalInfoService.updateSpeaker(user.sub, id, speakerId, dto);
  }

  @Delete(':id/speakers/:speakerId')
  async deleteSpeaker(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('speakerId') speakerId: string,
  ) {
    return this.additionalInfoService.deleteSpeaker(user.sub, id, speakerId);
  }

  // PRIZES ENDPOINTS
  @Get(':id/prizes')
  async getPrizes(@Param('id') id: string) {
    return this.additionalInfoService.getPrizes(id);
  }

  @Post(':id/prizes')
  @HttpCode(HttpStatus.CREATED)
  async createPrize(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreatePrizeDto,
  ) {
    return this.additionalInfoService.createPrize(user.sub, id, dto);
  }

  @Patch(':id/prizes/:prizeId')
  async updatePrize(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('prizeId') prizeId: string,
    @Body() dto: UpdatePrizeDto,
  ) {
    return this.additionalInfoService.updatePrize(user.sub, id, prizeId, dto);
  }

  @Delete(':id/prizes/:prizeId')
  async deletePrize(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('prizeId') prizeId: string,
  ) {
    return this.additionalInfoService.deletePrize(user.sub, id, prizeId);
  }

  // FAQ ENDPOINTS
  @Get(':id/faq')
  async getFaqs(
    @Param('id') id: string,
    @Query('include_unpublished') includeUnpublished?: string,
  ) {
    return this.additionalInfoService.getFaqs(id, includeUnpublished === 'true');
  }

  @Post(':id/faq')
  @HttpCode(HttpStatus.CREATED)
  async createFaq(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateFaqDto,
  ) {
    return this.additionalInfoService.createFaq(user.sub, id, dto);
  }

  @Patch(':id/faq/:faqId')
  async updateFaq(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('faqId') faqId: string,
    @Body() dto: UpdateFaqDto,
  ) {
    return this.additionalInfoService.updateFaq(user.sub, id, faqId, dto);
  }

  @Delete(':id/faq/:faqId')
  async deleteFaq(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('faqId') faqId: string,
  ) {
    return this.additionalInfoService.deleteFaq(user.sub, id, faqId);
  }

  // ==========================================
  // TICKETS ENDPOINTS
  // ==========================================

  /**
   * Get all tickets for an event
   */
  @Get(':id/tickets')
  async getTickets(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.ticketsService.getTickets(user.sub, id);
  }

  /**
   * Get single ticket
   */
  @Get(':id/tickets/:ticketId')
  async getTicket(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('ticketId') ticketId: string,
  ) {
    return this.ticketsService.getTicket(user.sub, id, ticketId);
  }

  /**
   * Create a ticket
   */
  @Post(':id/tickets')
  @HttpCode(HttpStatus.CREATED)
  async createTicket(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateTicketDto,
  ) {
    return this.ticketsService.createTicket(user.sub, id, dto);
  }

  /**
   * Update a ticket
   */
  @Patch(':id/tickets/:ticketId')
  async updateTicket(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('ticketId') ticketId: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.ticketsService.updateTicket(user.sub, id, ticketId, dto);
  }

  /**
   * Delete a ticket
   */
  @Delete(':id/tickets/:ticketId')
  async deleteTicket(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('ticketId') ticketId: string,
  ) {
    return this.ticketsService.deleteTicket(user.sub, id, ticketId);
  }

  // ==========================================
  // CUSTOM FIELDS ENDPOINTS
  // ==========================================

  /**
   * Get all custom fields for an event
   */
  @Get(':id/custom-fields')
  async getCustomFields(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.ticketsService.getCustomFields(user.sub, id);
  }

  /**
   * Create a custom field
   */
  @Post(':id/custom-fields')
  @HttpCode(HttpStatus.CREATED)
  async createCustomField(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateCustomFieldDto,
  ) {
    return this.ticketsService.createCustomField(user.sub, id, dto);
  }

  /**
   * Update a custom field
   */
  @Patch(':id/custom-fields/:fieldId')
  async updateCustomField(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateCustomFieldDto,
  ) {
    return this.ticketsService.updateCustomField(user.sub, id, fieldId, dto);
  }

  /**
   * Delete a custom field
   */
  @Delete(':id/custom-fields/:fieldId')
  async deleteCustomField(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('fieldId') fieldId: string,
  ) {
    return this.ticketsService.deleteCustomField(user.sub, id, fieldId);
  }
}
