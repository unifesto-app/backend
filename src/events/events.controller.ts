import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { EventStatus } from '@prisma/client';
import { EventsService } from './events.service';
import {
  CancelEventDto,
  CreateAgendaDto,
  CreateEventDto,
  CreateFormFieldDto,
  CreateSpeakerDto,
  CreateTicketTypeDto,
  EventFilterDto,
  UpdateEventDto,
  UpdateTicketTypeDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201 })
  async createEvent(@Request() req, @Body() dto: CreateEventDto) {
    return this.eventsService.createEvent(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get public events with filters' })
  @ApiResponse({ status: 200 })
  async getEvents(@Query() filters: EventFilterDto) {
    return this.eventsService.getEvents(filters);
  }

  @Get('space/:spaceId')
  @ApiOperation({ summary: 'Get all events for a space (including drafts)' })
  @ApiResponse({ status: 200 })
  async getSpaceEvents(
    @Param('spaceId') spaceId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.eventsService.getSpaceEvents(
      spaceId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      status as EventStatus | undefined,
    );
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get event details by slug' })
  @ApiResponse({ status: 200 })
  async getEventBySlug(@Param('slug') slug: string) {
    return this.eventsService.getEventBySlug(slug);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update event details' })
  @ApiResponse({ status: 200 })
  async updateEvent(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.updateEvent(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete draft event' })
  @ApiResponse({ status: 200 })
  async deleteEvent(@Request() req, @Param('id') id: string) {
    return this.eventsService.deleteEvent(req.user.id, id);
  }

  @Patch(':id/publish')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Publish event' })
  @ApiResponse({ status: 200 })
  async publishEvent(@Request() req, @Param('id') id: string) {
    return this.eventsService.publishEvent(req.user.id, id);
  }

  @Patch(':id/cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cancel event' })
  @ApiResponse({ status: 200 })
  async cancelEvent(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CancelEventDto,
  ) {
    return this.eventsService.cancelEvent(req.user.id, id, dto);
  }

  @Post(':id/cover')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload event cover image' })
  @ApiResponse({ status: 201 })
  async uploadCoverImage(
    @Request() req,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.eventsService.uploadCoverImage(req.user.id, id, file);
  }

  @Post(':id/ticket-types')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create ticket type' })
  @ApiResponse({ status: 201 })
  async createTicketType(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CreateTicketTypeDto,
  ) {
    return this.eventsService.createTicketType(req.user.id, id, dto);
  }

  @Patch(':id/ticket-types/:typeId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update ticket type' })
  @ApiResponse({ status: 200 })
  async updateTicketType(
    @Request() req,
    @Param('id') id: string,
    @Param('typeId') typeId: string,
    @Body() dto: UpdateTicketTypeDto,
  ) {
    return this.eventsService.updateTicketType(req.user.id, id, typeId, dto);
  }

  @Delete(':id/ticket-types/:typeId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete ticket type' })
  @ApiResponse({ status: 200 })
  async deleteTicketType(
    @Request() req,
    @Param('id') id: string,
    @Param('typeId') typeId: string,
  ) {
    return this.eventsService.deleteTicketType(req.user.id, id, typeId);
  }

  @Post(':id/agenda')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add agenda item' })
  @ApiResponse({ status: 201 })
  async createAgenda(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CreateAgendaDto,
  ) {
    return this.eventsService.createAgenda(req.user.id, id, dto);
  }

  @Post(':id/speakers')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add speaker' })
  @ApiResponse({ status: 201 })
  async createSpeaker(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CreateSpeakerDto,
  ) {
    return this.eventsService.createSpeaker(req.user.id, id, dto);
  }

  @Post(':id/form-fields')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add custom form field' })
  @ApiResponse({ status: 201 })
  async createFormField(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CreateFormFieldDto,
  ) {
    return this.eventsService.createFormField(req.user.id, id, dto);
  }
}
