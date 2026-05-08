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
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationQueryDto } from './dto/organization-query.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrgPermissionGuard } from '../permissions/guards/org-permission.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { CurrentUser } from '../permissions/decorators/current-user.decorator';
import type { RequestUser } from '../auth/interfaces/user.interface';

@Controller('organizations')
@UseGuards(SupabaseAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: RequestUser,
    @Query() query: OrganizationQueryDto,
  ) {
    return this.organizationsService.findAll(user.sub, query);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.organizationsService.findOne(user.sub, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: RequestUser,
    @Body() createDto: CreateOrganizationDto,
  ) {
    return this.organizationsService.create(user.sub, createDto);
  }

  @Patch(':id')
  @UseGuards(OrgPermissionGuard)
  @RequirePermission('manage_organization')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(user.sub, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.organizationsService.remove(user.sub, id);
  }

  @Get(':id/hierarchy')
  async getHierarchy(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.organizationsService.getHierarchy(user.sub, id);
  }

  @Get(':id/permissions')
  async getPermissions(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.organizationsService.getPermissions(user.sub, id);
  }
}
