import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PublicOrganizationsService } from './public-organizations.service';

/**
 * Public Organizations Controller
 * Handles public organization endpoints that don't require authentication
 * Used by mobile app and public website
 */
@Controller('public/organizations')
export class PublicOrganizationsController {
  constructor(
    private readonly publicOrganizationsService: PublicOrganizationsService,
  ) {}

  /**
   * GET /public/organizations
   * Get all active organizations (no auth required)
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.publicOrganizationsService.findAllPublic({
      page,
      limit,
      search,
    });
  }

  /**
   * GET /public/organizations/slug/:slug
   * Get organization by slug (no auth required)
   * IMPORTANT: This must come before :id route
   */
  @Get('slug/:slug')
  @HttpCode(HttpStatus.OK)
  async findBySlug(@Param('slug') slug: string) {
    return this.publicOrganizationsService.findBySlugPublic(slug);
  }

  /**
   * GET /public/organizations/:id
   * Get organization by ID (no auth required)
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.publicOrganizationsService.findOnePublic(id);
  }

  /**
   * GET /public/organizations/:id/sub-orgs
   * Get sub-organizations (no auth required)
   */
  @Get(':id/sub-orgs')
  @HttpCode(HttpStatus.OK)
  async getSubOrganizations(@Param('id') id: string) {
    return this.publicOrganizationsService.getSubOrganizations(id);
  }

  /**
   * GET /public/organizations/:id/events
   * Get organization's published events (no auth required)
   */
  @Get(':id/events')
  @HttpCode(HttpStatus.OK)
  async getOrganizationEvents(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.publicOrganizationsService.getOrganizationEvents(id, {
      page,
      limit,
    });
  }
}
