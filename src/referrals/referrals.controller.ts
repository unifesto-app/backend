import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '@prisma/client';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class ApplyReferralDto {
  @ApiProperty({ example: 'ABC12345' })
  @IsString()
  code: string;
}

@ApiTags('Referrals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('referral')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get()
  @ApiOperation({ summary: 'Get my referral code and stats' })
  @ApiResponse({ status: 200 })
  async getMyReferralStats(@Request() req) {
    return this.referralsService.getMyReferralStats(req.user.id);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply a referral code (one-time only)' })
  @ApiResponse({ status: 201 })
  async applyReferralCode(@Request() req, @Body() dto: ApplyReferralDto) {
    return this.referralsService.applyReferralCode(req.user.id, dto.code);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: 'Get all referrals (admin only)' })
  @ApiResponse({ status: 200 })
  async getAllReferrals(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.referralsService.getAllReferrals(+page, +limit);
  }
}
