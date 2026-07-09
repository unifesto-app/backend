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
import { JwtAuthGuard, RolesGuard, SpaceRoleGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import {
  CreateSpaceDto,
  UpdateSpaceDto,
  UpdateSpaceStatusDto,
  CreateSpaceStatusRequestDto,
  ReviewSpaceStatusRequestDto,
  AddSpaceMemberDto,
  UpdateSpaceMemberRoleDto,
} from './dto';
import { CreateSpaceRequestDto } from './dto/create-space-request.dto';
import {
  CreateSubSpaceRequestDto,
  ReviewSubSpaceRequestDto,
} from './dto/sub-space-request.dto';
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
   * Get all space requests (ADMIN only)
   * GET /spaces/requests?status=PENDING
   * NOTE: Must be declared before the ':id' route so "requests" is not
   * captured as a space id.
   */
  @Get('requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  async getAllSpaceRequests(@Query('status') status?: string) {
    return this.spacesService.getAllSpaceRequests(status);
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

  /**
   * Approve a space request (ADMIN only)
   * PATCH /spaces/requests/:id/approve
   */
  @Patch('requests/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  async approveSpaceRequest(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.spacesService.approveSpaceRequest(id, user.id);
  }

  /**
   * Reject a space request (ADMIN only)
   * PATCH /spaces/requests/:id/reject
   */
  @Patch('requests/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  async rejectSpaceRequest(
    @Param('id') id: string,
    @Body() body: { reviewNote?: string },
    @CurrentUser() user: User,
  ) {
    return this.spacesService.rejectSpaceRequest(id, user.id, body?.reviewNote);
  }

  /**
   * Create a space status-change request (organiser only)
   * POST /spaces/status-requests
   * NOTE: Declared before ':id' so "status-requests" isn't captured as an id.
   */
  @Post('status-requests')
  @UseGuards(JwtAuthGuard)
  async createSpaceStatusRequest(
    @CurrentUser() user: User,
    @Body() dto: CreateSpaceStatusRequestDto,
  ) {
    return this.spacesService.createSpaceStatusRequest(user.id, dto);
  }

  /**
   * Get my space status requests (organiser)
   * GET /spaces/status-requests/my
   */
  @Get('status-requests/my')
  @UseGuards(JwtAuthGuard)
  async getMySpaceStatusRequests(
    @CurrentUser() user: User,
    @Query('spaceId') spaceId?: string,
  ) {
    return this.spacesService.getMySpaceStatusRequests(user.id, spaceId);
  }

  /**
   * Get all space status requests (ADMIN only)
   * GET /spaces/status-requests?status=PENDING
   */
  @Get('status-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  async getAllSpaceStatusRequests(
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.spacesService.getAllSpaceStatusRequests(status, +page, +limit);
  }

  /**
   * Review (approve/reject) a space status request (ADMIN only)
   * PATCH /spaces/status-requests/:id/review
   */
  @Patch('status-requests/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  async reviewSpaceStatusRequest(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: ReviewSpaceStatusRequestDto,
  ) {
    return this.spacesService.reviewSpaceStatusRequest(id, user.id, dto);
  }

  /**
   * Submit a sub-space request (authenticated users)
   * POST /spaces/sub-space-requests
   */
  @Post('sub-space-requests')
  @UseGuards(JwtAuthGuard)
  async createSubSpaceRequest(
    @CurrentUser() user: User,
    @Body() dto: CreateSubSpaceRequestDto,
  ) {
    return this.spacesService.createSubSpaceRequest(user.id, dto);
  }

  /**
   * Get the current user's sub-space requests
   * GET /spaces/sub-space-requests/mine
   */
  @Get('sub-space-requests/mine')
  @UseGuards(JwtAuthGuard)
  async getMySubSpaceRequests(@CurrentUser() user: User) {
    return this.spacesService.getMySubSpaceRequests(user.id);
  }

  /**
   * Get all sub-space requests (ADMIN only)
   * GET /spaces/sub-space-requests?status=PENDING
   */
  @Get('sub-space-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  async getAllSubSpaceRequests(
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.spacesService.getAllSubSpaceRequests(status, +page, +limit);
  }

  /**
   * Review (approve/reject) a sub-space request (ADMIN only)
   * PATCH /spaces/sub-space-requests/:id/review
   */
  @Patch('sub-space-requests/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  async reviewSubSpaceRequest(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: ReviewSubSpaceRequestDto,
  ) {
    return this.spacesService.reviewSubSpaceRequest(id, user.id, dto);
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
        // Custom JWTs carry `userId`; Cognito JWTs carry the id under `sub`.
        userId = decoded?.userId ?? decoded?.sub;
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
  @UseGuards(JwtAuthGuard, SpaceRoleGuard)
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
   * Get space members with pagination and search.
   * Accessible by platform admins and the space's organiser/co-organiser team.
   * GET /spaces/:id/members?page=1&limit=20&search=&role=MEMBER
   */
  @Get(':id/members')
  @UseGuards(JwtAuthGuard, SpaceRoleGuard)
  async getSpaceMembers(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: RoleCode,
  ) {
    return this.spacesService.getSpaceMembers(id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
      roleCode: role,
    });
  }

  /**
   * Search users who can be added to a space (excludes current members).
   * GET /spaces/:id/member-search?q=jane
   */
  @Get(':id/member-search')
  @UseGuards(JwtAuthGuard, SpaceRoleGuard)
  async searchAddableUsers(
    @Param('id') id: string,
    @Query('q') q?: string,
  ) {
    return this.spacesService.searchAddableUsers(id, q);
  }

  /**
   * Add a member to a space with a given role.
   * Admins may assign any role; organisers may assign co-organiser and below.
   * POST /spaces/:id/members
   */
  @Post(':id/members')
  @UseGuards(JwtAuthGuard, SpaceRoleGuard)
  async addSpaceMember(
    @Param('id') id: string,
    @Body() dto: AddSpaceMemberDto,
    @CurrentUser() user: User,
  ) {
    return this.spacesService.addSpaceMember(id, user.id, dto.userId, dto.role);
  }

  /**
   * Update a member's role within a space.
   * PATCH /spaces/:id/members/:userRoleId
   */
  @Patch(':id/members/:userRoleId')
  @UseGuards(JwtAuthGuard, SpaceRoleGuard)
  async updateSpaceMemberRole(
    @Param('id') id: string,
    @Param('userRoleId') userRoleId: string,
    @Body() dto: UpdateSpaceMemberRoleDto,
    @CurrentUser() user: User,
  ) {
    return this.spacesService.updateSpaceMemberRole(
      id,
      userRoleId,
      user.id,
      dto.role,
    );
  }

  /**
   * Remove a member from a space.
   * DELETE /spaces/:id/members/:userRoleId
   */
  @Delete(':id/members/:userRoleId')
  @UseGuards(JwtAuthGuard, SpaceRoleGuard)
  async removeSpaceMember(
    @Param('id') id: string,
    @Param('userRoleId') userRoleId: string,
    @CurrentUser() user: User,
  ) {
    return this.spacesService.removeSpaceMember(id, userRoleId, user.id);
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
}

