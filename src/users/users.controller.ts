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
import { UsersService } from './users.service';
import { UserQueryDto } from './dto/user-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BulkOperationDto } from './dto/bulk-operation.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/interfaces/user.interface';

@Controller('admin/users')
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /admin/users
   * List all users with pagination and filters
   */
  @Get()
  async findAll(@CurrentUser() user: RequestUser, @Query() query: UserQueryDto) {
    return this.usersService.findAll(user.sub, query);
  }

  /**
   * GET /admin/users/stats
   * Get user statistics
   */
  @Get('stats')
  async getStats(@CurrentUser() user: RequestUser) {
    return this.usersService.getStats(user.sub);
  }

  /**
   * GET /admin/users/:id
   * Get user by ID
   */
  @Get(':id')
  async findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.usersService.findOne(user.sub, id);
  }

  /**
   * POST /admin/users
   * Create a new user
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: RequestUser, @Body() createDto: CreateUserDto) {
    return this.usersService.create(user.sub, createDto);
  }

  /**
   * POST /admin/users/bulk
   * Bulk operations on users
   */
  @Post('bulk')
  @HttpCode(HttpStatus.OK)
  async bulkOperation(@CurrentUser() user: RequestUser, @Body() bulkDto: BulkOperationDto) {
    return this.usersService.bulkOperation(user.sub, bulkDto);
  }

  /**
   * PATCH /admin/users/:id
   * Update user
   */
  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateUserDto,
  ) {
    return this.usersService.update(user.sub, id, updateDto);
  }

  /**
   * DELETE /admin/users/:id
   * Delete user
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.usersService.remove(user.sub, id);
  }
}
