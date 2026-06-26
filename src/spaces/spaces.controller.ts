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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Headers,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SpacesService } from './spaces.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import { CreateSpaceDto, UpdateSpaceDto, UpdateSpaceStatusDto } from './dto';
import { CreateSpaceRequestDto } from './dto/create-space-request.dto';
import { RoleCode, SpaceStatus, SpaceVisibility } from '@prisma/client';
import type { User } from '@prisma/client';

@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  /**
   * Create a new space (ADMIN only)
   * POST /spaces
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  async createSpace(
    @Body() dto: CreateSpaceDto,
    @CurrentUser() user: User,
  ) {
    return this.spacesService.createSpace(dto, user.id);
  }

  /**
   * Get all spaces with filters (PUBLIC - no auth required)
   * GET /spaces?page=1&limit=10&status=ACTIVE&visibility=PUBLIC&search=tech
   */
  @Get()
  async getAllSpaces(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: SpaceStatus,
    @Query('visibility') visibility?: SpaceVisibility,
    @Query('search') search?: string,
    @Query('parentId') parentId?: string,
  ) {
    return this.spacesService.getAllSpaces({
      parentId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      status,
      visibility,
      search,
    });
  }

  /**
   * Get space by slug (PUBLIC - for mobile view)
   * GET /spaces/slug/:slug
   */
  @Get('slug/:slug')
  async getSpaceBySlug(@Param('slug') slug: string) {
    return this.spacesService.getSpaceBySlug(slug);
  }

  /**
   * Get space by ID (PUBLIC - for mobile view)
   * GET /spaces/:id
   */
  @Get(':id')
  async getSpaceById(@Param('id') id: string, @Headers('authorization') auth?: string) {
    let userId: string | undefined;
    if (auth?.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded: any = jwt.decode(auth.replace('Bearer ', ''));
        userId = decoded?.userId;
      } catch {}
    }
    return this.spacesService.getSpaceById(id, userId);
  }

  /**
   * Join a space (Authenticated users)
   * POST /spaces/:id/join
   */
  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async joinSpace(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.spacesService.joinSpace(id, user.id);
  }

  /**
   * Leave a space (Authenticated users)
   * POST /spaces/:id/leave
   */
  @Post(':id/leave')
  @UseGuards(JwtAuthGuard)
  async leaveSpace(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.spacesService.leaveSpace(id, user.id);
  }

  /**
   * Update space (ADMIN only)
   * PATCH /spaces/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  async updateSpace(
    @Param('id') id: string,
    @Body() dto: UpdateSpaceDto,
  ) {
    return this.spacesService.updateSpace(id, dto);
  }

  /**
   * Update space status (ADMIN only)
   * PATCH /spaces/:id/status
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  async updateSpaceStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSpaceStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.spacesService.updateSpaceStatus(id, dto, user.id);
  }

  /**
   * Delete space (ADMIN only)
   * DELETE /spaces/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  async deleteSpace(@Param('id') id: string) {
    return this.spacesService.deleteSpace(id);
  }

  /**
   * Upload space logo (ADMIN only)
   * POST /spaces/:id/logo
   */
  @Post(':id/logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  @UseInterceptors(FileInterceptor('logo'))
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }), // 2MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.spacesService.uploadLogo(id, file);
  }

  /**
   * Upload space banner (ADMIN only)
   * POST /spaces/:id/banner
   */
  @Post(':id/banner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  @UseInterceptors(FileInterceptor('banner'))
  async uploadBanner(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.spacesService.uploadBanner(id, file);
  }

  /**
   * Get space members (ADMIN only)
   * GET /spaces/:id/members
   */
  @Get(':id/members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  async getSpaceMembers(@Param('id') id: string) {
    return this.spacesService.getSpaceMembers(id);
  }
  /**
   * Submit a space request (authenticated users)
   * POST /spaces/request
   */
  @Post('request')
  @UseGuards(JwtAuthGuard)
  async createSpaceRequest(
    @Body() dto: CreateSpaceRequestDto,
    @CurrentUser() user: User,
  ) {
    return this.spacesService.createSpaceRequest(user.id, dto);
  }

  /**
   * Get my space requests
   * GET /spaces/my-requests
   */
  @Get('my-requests')
  @UseGuards(JwtAuthGuard)
  async getMySpaceRequests(@CurrentUser() user: User) {
    return this.spacesService.getMySpaceRequests(user.id);
  }

}
