import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { CacheService } from '../cache/cache.service';
import {
  AdminGrantCoinsDto,
  CreateRedeemCodeDto,
  PartnerRedeemDto,
  RedeemCodeDto,
  UpdateRedeemCodeDto,
  WalletResponseDto,
  WalletTransactionResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my wallet balance and stats' })
  @ApiResponse({ status: 200, type: WalletResponseDto })
  async getMyWallet(@Request() req) {
    return this.walletService.getWallet(req.user.id);
  }

  @Get('transactions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my transaction history' })
  @ApiResponse({ status: 200, type: [WalletTransactionResponseDto] })
  async getMyTransactions(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.walletService.getTransactions(req.user.id, +page, +limit);
  }

  @Post('redeem')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Redeem a code for coins' })
  @ApiResponse({ status: 201 })
  async redeemCode(@Request() req, @Body() dto: RedeemCodeDto) {
    return this.walletService.redeemCode(req.user.id, dto.code);
  }

  @Post('admin/grant')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: 'Grant coins to a user (admin only)' })
  @ApiResponse({ status: 201 })
  async adminGrantCoins(@Request() req, @Body() dto: AdminGrantCoinsDto) {
    return this.walletService.adminGrantCoins(dto, req.user.id);
  }

  @Get('admin/users/:userId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: 'Get user wallet (admin only)' })
  @ApiResponse({ status: 200 })
  async getUserWallet(@Param('userId') userId: string) {
    return this.walletService.getWallet(userId);
  }

  @Get('admin/redeem-codes')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: 'List all redeem codes (admin only)' })
  @ApiResponse({ status: 200 })
  async getAllRedeemCodes(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.walletService.getAllRedeemCodes(+page, +limit);
  }

  @Post('admin/redeem-codes')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: 'Create redeem code (admin only)' })
  @ApiResponse({ status: 201 })
  async createRedeemCode(@Request() req, @Body() dto: CreateRedeemCodeDto) {
    return this.walletService.createRedeemCode(dto, req.user.id);
  }

  @Patch('admin/redeem-codes/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: 'Update redeem code (admin only)' })
  @ApiResponse({ status: 200 })
  async updateRedeemCode(
    @Param('id') id: string,
    @Body() dto: UpdateRedeemCodeDto,
  ) {
    return this.walletService.updateRedeemCode(id, dto);
  }

  @Delete('admin/redeem-codes/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: 'Deactivate redeem code (admin only)' })
  @ApiResponse({ status: 200 })
  async deleteRedeemCode(@Param('id') id: string) {
    return this.walletService.deleteRedeemCode(id);
  }

  @Post('partners/redeem')
  @ApiSecurity('X-API-Key')
  @ApiOperation({ summary: 'Partner redeem coins (API key auth)' })
  @ApiResponse({ status: 201 })
  async partnerRedeem(
    @Headers('x-api-key') apiKey: string,
    @Body() dto: PartnerRedeemDto,
  ) {
    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    // Try to get partner from cache
    const cachedPartner = await this.cache.validatePartnerApiKey(apiKey);
    let partner = cachedPartner;

    if (!partner) {
      // Cache miss - fetch from DB
      partner = await this.prisma.partner.findUnique({
        where: { apiKey },
      });

      if (partner && partner.isActive) {
        // Cache for next time
        await this.cache.setPartnerApiKey(apiKey, partner);
      }
    }

    if (!partner || !partner.isActive) {
      throw new UnauthorizedException('Invalid API key');
    }

    return this.walletService.partnerRedeemCoins(dto, partner.id);
  }

  @Get('partners/validate/:userId')
  @ApiSecurity('X-API-Key')
  @ApiOperation({ summary: 'Validate user exists (API key auth)' })
  @ApiResponse({ status: 200 })
  async validateUser(
    @Headers('x-api-key') apiKey: string,
    @Param('userId') userId: string,
  ) {
    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    // Try to get partner from cache
    const cachedPartner = await this.cache.validatePartnerApiKey(apiKey);
    let partner = cachedPartner;

    if (!partner) {
      // Cache miss - fetch from DB
      partner = await this.prisma.partner.findUnique({
        where: { apiKey },
      });

      if (partner && partner.isActive) {
        // Cache for next time
        await this.cache.setPartnerApiKey(apiKey, partner);
      }
    }

    if (!partner || !partner.isActive) {
      throw new UnauthorizedException('Invalid API key');
    }

    return this.walletService.validateUser(userId);
  }
}
