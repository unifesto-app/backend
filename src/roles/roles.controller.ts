import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@Controller('roles')
@UseGuards(SupabaseAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll(@Request() req) {
    return this.rolesService.findAll(req.user.id);
  }

  @Get('scope/:scope')
  async findByScope(@Request() req, @Param('scope') scope: string) {
    return this.rolesService.findByScope(req.user.id, scope);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.rolesService.findOne(req.user.id, id);
  }

  @Post()
  async create(@Request() req, @Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(req.user.id, createRoleDto);
  }

  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(req.user.id, id, updateRoleDto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.rolesService.remove(req.user.id, id);
  }
}
