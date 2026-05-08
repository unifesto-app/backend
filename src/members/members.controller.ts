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
import { MembersService } from './members.service';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrgPermissionGuard } from '../permissions/guards/org-permission.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { CurrentUser } from '../permissions/decorators/current-user.decorator';
import type { RequestUser } from '../auth/interfaces/user.interface';

@Controller('organizations/:id/members')
@UseGuards(SupabaseAuthGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  async findAll(
    @CurrentUser() user: RequestUser,
    @Param('id') orgId: string,
    @Query('role') role?: string,
  ) {
    return this.membersService.findAll(user.sub, orgId, role);
  }

  @Post()
  @UseGuards(OrgPermissionGuard)
  @RequirePermission('manage_members')
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @CurrentUser() user: RequestUser,
    @Param('id') orgId: string,
    @Body() addMemberDto: AddMemberDto,
  ) {
    return this.membersService.addMember(user.sub, orgId, addMemberDto);
  }

  @Patch(':memberId')
  @UseGuards(OrgPermissionGuard)
  @RequirePermission('manage_members')
  async updateMemberRole(
    @CurrentUser() user: RequestUser,
    @Param('id') orgId: string,
    @Param('memberId') memberId: string,
    @Body() updateDto: UpdateMemberRoleDto,
  ) {
    return this.membersService.updateMemberRole(
      user.sub,
      orgId,
      memberId,
      updateDto,
    );
  }

  @Delete(':memberId')
  @UseGuards(OrgPermissionGuard)
  @RequirePermission('manage_members')
  @HttpCode(HttpStatus.OK)
  async removeMember(
    @CurrentUser() user: RequestUser,
    @Param('id') orgId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.removeMember(user.sub, orgId, memberId);
  }
}
