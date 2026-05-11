import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PublicEventsService } from './public-events.service';
import { EventQueryDto } from './dto/event-query.dto';

/**
 * Public Events Controller
 * Handles public event endpoints that don't require authentication
 * Used by mobile app and public website
 */
@Controller('public/events')
export class PublicEventsController {
  constructor(private readonly publicEventsService: PublicEventsService) {}

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
   * GET /public/events/:id
   * Get event by ID (no auth required)
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.publicEventsService.findOnePublic(id);
  }
}
