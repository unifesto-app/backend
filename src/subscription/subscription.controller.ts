import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
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
import { SubscriptionService } from './subscription.service';
import {
  AdminUpdateSubscriptionDto,
  SubscriptionResponseDto,
  SubscriptionUsageDto,
  UpgradeSubscriptionDto,
  VerifyUpgradeDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '@prisma/client';

@ApiTags('Subscription')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  @ApiOperation({ summary: 'Get my subscription details' })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  async getMySubscription(@Request() req) {
    return this.subscriptionService.getMySubscription(req.user.id);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get my subscription usage stats' })
  @ApiResponse({ status: 200, type: SubscriptionUsageDto })
  async getMyUsage(@Request() req) {
    return this.subscriptionService.getMyUsage(req.user.id);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all available plans with pricing' })
  @ApiResponse({ status: 200 })
  async getAllPlans() {
    return this.subscriptionService.getAllPlans();
  }

  @Post('upgrade')
  @ApiOperation({ summary: 'Create Razorpay order for plan upgrade' })
  @ApiResponse({ status: 201 })
  async createUpgradeOrder(@Request() req, @Body() dto: UpgradeSubscriptionDto) {
    return this.subscriptionService.createUpgradeOrder(req.user.id, dto);
  }

  @Post('upgrade/verify')
  @ApiOperation({ summary: 'Verify Razorpay payment and activate plan' })
  @ApiResponse({ status: 200 })
  async verifyUpgrade(@Request() req, @Body() dto: VerifyUpgradeDto) {
    return this.subscriptionService.verifyAndActivate(req.user.id, dto);
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel subscription and downgrade to STARTER' })
  @ApiResponse({ status: 200 })
  async cancelSubscription(@Request() req) {
    return this.subscriptionService.cancelSubscription(req.user.id);
  }

  @Get('admin/all')
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: 'Get all subscriptions (admin only)' })
  @ApiResponse({ status: 200 })
  async getAllSubscriptions(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.subscriptionService.getAllSubscriptions(+page, +limit);
  }

  @Patch('admin/:userId')
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: 'Manually update user subscription (admin only)' })
  @ApiResponse({ status: 200 })
  async adminUpdateSubscription(
    @Param('userId') userId: string,
    @Body() dto: AdminUpdateSubscriptionDto,
  ) {
    return this.subscriptionService.adminUpdateSubscription(userId, dto);
  }
}
