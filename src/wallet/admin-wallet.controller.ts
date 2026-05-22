import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/interfaces/user.interface';
import { AdminWalletQueryDto } from './dto/admin-wallet-query.dto';
import { AdminCreateTransactionDto } from './dto/admin-transaction.dto';
import { createClient } from '@supabase/supabase-js';

@Controller('admin/wallet')
@UseGuards(SupabaseAuthGuard)
export class AdminWalletController {
  private readonly logger = new Logger(AdminWalletController.name);
  private adminClient;

  constructor(private readonly walletService: WalletService) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  /**
   * Check if user has admin role
   */
  private async checkAdminRole(userId: string): Promise<boolean> {
    const { data: profile } = await this.adminClient
      .from('profiles_with_roles')
      .select('role, roles')
      .eq('id', userId)
      .single();

    if (!profile) return false;

    const roles = profile.roles || [profile.role];
    return roles.some((r: string) => ['admin', 'super_admin'].includes(r));
  }

  /**
   * GET /admin/wallet
   * Get all wallets with pagination
   */
  @Get()
  async getAllWallets(@CurrentUser() user: RequestUser, @Query() query: AdminWalletQueryDto) {
    const isAdmin = await this.checkAdminRole(user.sub);
    if (!isAdmin) {
      throw new ForbiddenException('Admin privileges required');
    }

    return this.walletService.getAllWallets(query);
  }

  /**
   * GET /admin/wallet/:userId
   * Get wallet for specific user
   */
  @Get(':userId')
  async getUserWallet(@CurrentUser() user: RequestUser, @Param('userId') userId: string) {
    const isAdmin = await this.checkAdminRole(user.sub);
    if (!isAdmin) {
      throw new ForbiddenException('Admin privileges required');
    }

    return this.walletService.getUserWallet(userId);
  }

  /**
   * GET /admin/wallet/:userId/transactions
   * Get transaction history for user
   */
  @Get(':userId/transactions')
  async getUserTransactions(
    @CurrentUser() user: RequestUser,
    @Param('userId') userId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    const isAdmin = await this.checkAdminRole(user.sub);
    if (!isAdmin) {
      throw new ForbiddenException('Admin privileges required');
    }

    return this.walletService.getTransactions(userId, limit, offset);
  }

  /**
   * POST /admin/wallet/:userId/transactions
   * Create transaction for user (admin adjustment)
   */
  @Post(':userId/transactions')
  @HttpCode(HttpStatus.CREATED)
  async createTransaction(
    @CurrentUser() user: RequestUser,
    @Param('userId') userId: string,
    @Body() dto: AdminCreateTransactionDto,
  ) {
    const isAdmin = await this.checkAdminRole(user.sub);
    if (!isAdmin) {
      throw new ForbiddenException('Admin privileges required');
    }

    this.logger.log(`Admin ${user.sub} creating transaction for user ${userId}`);
    return this.walletService.adminCreateTransaction(userId, dto);
  }
}
