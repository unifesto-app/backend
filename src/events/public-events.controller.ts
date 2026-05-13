import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PublicEventsService } from './public-events.service';
import { EventAdditionalInfoService } from './event-additional-info.service';
import { EventQueryDto } from './dto/event-query.dto';

/**
 * Public Events Controller
 * Handles public event endpoints that don't require authentication
 * Used by mobile app and public website
 */
@Controller('public/events')
export class PublicEventsController {
  constructor(
    private readonly publicEventsService: PublicEventsService,
    private readonly additionalInfoService: EventAdditionalInfoService,
  ) {}

  /**
   * GET /public/events
   * Get all published events (no auth required)
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: EventQueryDto) {
    return this.publicEventsService.findAllPublic(query);
  }

  /**
   * GET /public/events/featured
   * Get featured events (no auth required)
   */
  @Get('featured')
  @HttpCode(HttpStatus.OK)
  async getFeatured(@Query('limit') limit?: number) {
    return this.publicEventsService.getFeaturedEvents(limit);
  }

  /**
   * GET /public/events/trending
   * Get trending events (ongoing only, no auth required)
   */
  @Get('trending')
  @HttpCode(HttpStatus.OK)
  async getTrending(@Query('limit') limit?: number) {
    return this.publicEventsService.getTrendingEvents(limit);
  }

  /**
   * GET /public/events/slug/:slug
   * Get event by slug (no auth required)
   * IMPORTANT: This must come before :id route
   */
  @Get('slug/:slug')
  @HttpCode(HttpStatus.OK)
  async findBySlug(@Param('slug') slug: string) {
    return this.publicEventsService.findBySlugPublic(slug);
  }

  /**
   * GET /public/events/:id
   * Get event by ID (no auth required)
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.publicEventsService.findOnePublic(id);
  }

  /**
   * GET /public/events/:id/agenda
   * Get event agenda (no auth required)
   */
  @Get(':id/agenda')
  @HttpCode(HttpStatus.OK)
  async getAgenda(@Param('id') id: string) {
    return this.additionalInfoService.getAgenda(id);
  }

  /**
   * GET /public/events/:id/speakers
   * Get event speakers (no auth required)
   */
  @Get(':id/speakers')
  @HttpCode(HttpStatus.OK)
  async getSpeakers(@Param('id') id: string) {
    return this.additionalInfoService.getSpeakers(id);
  }

  /**
   * GET /public/events/:id/prizes
   * Get event prizes (no auth required)
   */
  @Get(':id/prizes')
  @HttpCode(HttpStatus.OK)
  async getPrizes(@Param('id') id: string) {
    return this.additionalInfoService.getPrizes(id);
  }

  /**
   * GET /public/events/:id/faq
   * Get event FAQs (no auth required, only published)
   */
  @Get(':id/faq')
  @HttpCode(HttpStatus.OK)
  async getFaqs(@Param('id') id: string) {
    return this.additionalInfoService.getFaqs(id, false); // Only published FAQs
  }

  /**
   * GET /public/events/:id/additional-info
   * Get all additional info (no auth required)
   */
  @Get(':id/additional-info')
  @HttpCode(HttpStatus.OK)
  async getAllAdditionalInfo(@Param('id') id: string) {
    return this.additionalInfoService.getAllAdditionalInfo(id, false); // Only published FAQs
  }
}
