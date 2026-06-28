import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';
import { AddBankAccountDto, CreatePayoutDto, UpdateBankAccountStatusDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '@prisma/client';

@ApiTags('Payouts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post('bank-accounts')
  async addBankAccount(@Request() req, @Body() dto: AddBankAccountDto) {
    return this.payoutsService.addBankAccount(req.user.id, dto);
  }

  @Get('bank-accounts')
  async getMyBankAccounts(@Request() req) {
    return this.payoutsService.getMyBankAccounts(req.user.id);
  }

  @Delete('bank-accounts/:id')
  async deleteBankAccount(@Request() req, @Param('id') id: string) {
    return this.payoutsService.deleteBankAccount(req.user.id, id);
  }

  @Get('my')
  async getMyPayouts(@Request() req, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.payoutsService.getPayoutsForOrganiser(req.user.id, +page, +limit);
  }

  @Get('event/:eventId/summary')
  async getEventPayoutSummary(@Request() req, @Param('eventId') eventId: string) {
    return this.payoutsService.getEventPayoutSummary(eventId, req.user.id);
  }

  @Get('admin/bank-accounts')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN)
  async getAllBankAccounts(@Query('page') page = 1, @Query('limit') limit = 20, @Query('status') status?: string) {
    return this.payoutsService.getAllBankAccounts(+page, +limit, status);
  }

  @Patch('admin/bank-accounts/:id/status')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN)
  async updateBankAccountStatus(@Request() req, @Param('id') id: string, @Body() dto: UpdateBankAccountStatusDto) {
    return this.payoutsService.updateBankAccountStatus(id, dto, req.user.id);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN)
  async getAllPayouts(@Query('page') page = 1, @Query('limit') limit = 20, @Query('status') status?: string) {
    return this.payoutsService.getAllPayouts(+page, +limit, status);
  }

  @Get('admin/event/:eventId/summary')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN)
  async getAdminEventPayoutSummary(@Param('eventId') eventId: string) {
    return this.payoutsService.getEventPayoutSummary(eventId);
  }

  @Post('admin')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN)
  async createPayout(@Request() req, @Body() dto: CreatePayoutDto) {
    return this.payoutsService.createPayout(dto, req.user.id);
  }

  @Post('admin/:id/process')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN)
  async processPayout(@Param('id') id: string) {
    return this.payoutsService.processPayoutTransfer(id);
  }

  @Patch('admin/:id/cancel')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN)
  async cancelPayout(@Request() req, @Param('id') id: string) {
    return this.payoutsService.cancelPayout(id, req.user.id);
  }
}
