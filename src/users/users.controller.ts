import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto, CheckUsernameDto } from './dto';
import type { User } from '@prisma/client';
import { UserProfileDto } from '../auth/dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get current user profile
   * GET /users/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: User): Promise<UserProfileDto> {
    return this.usersService.getMe(user.id);
  }

  /**
   * Update current user profile
   * PATCH /users/me
   */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    return this.usersService.updateMe(user.id, dto);
  }

  /**
   * Complete onboarding
   * POST /users/me/onboard
   */
  @Post('me/onboard')
  @UseGuards(JwtAuthGuard)
  async completeOnboarding(
    @CurrentUser() user: User,
  ): Promise<UserProfileDto> {
    return this.usersService.completeOnboarding(user.id);
  }

  /**
   * Upload avatar
   * POST /users/me/avatar
   */
  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<{ avatarUrl: string }> {
    return this.usersService.uploadAvatar(user.id, file);
  }

  /**
   * Check username availability
   * POST /users/check-username
   */
  @Post('check-username')
  async checkUsername(
    @Body() dto: CheckUsernameDto,
  ): Promise<{ available: boolean }> {
    return this.usersService.checkUsernameAvailability(dto.username);
  }

  /**
   * Get user by username
   * GET /users/:username
   */
  @Get(':username')
  async getUserByUsername(
    @Param('username') username: string,
  ): Promise<UserProfileDto> {
    return this.usersService.getUserByUsername(username);
  }
}
