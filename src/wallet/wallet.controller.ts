import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Param,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/interfaces/user.interface';
import { AddCoinsDto, SpendCoinsDto, ApplyReferralDto, ApplyRedeemCodeDto } from './dto/wallet.dto';
import { AdminWalletQueryDto } from './dto/admin-wallet-query.dto';
import { AdminCreateTransactionDto } from './dto/admin-transaction.dto';

@Controller('wallet')
@UseGuards(SupabaseAuthGuard)
export class WalletController {
  private readonly logger = new Logger(WalletController.name);

  constructor(private readonly walletService: WalletService) {}

  /**
   * GET /wallet
   * Get wallet balance
   */
  @Get()
  async getWallet(@CurrentUser() user: RequestUser) {
    this.logger.debug(`Fetching wallet for user: ${user.sub}`);

    const balance = await this.walletService.getWalletBalance(user.sub);

    return {
      balance: balance.balance,
      currency: balance.currency,
    };
  }

  /**
   * GET /wallet/stats
   * Get wallet statistics
   */
  @Get('stats')
  async getWalletStats(@CurrentUser() user: RequestUser) {
    this.logger.debug(`Fetching wallet stats for user: ${user.sub}`);

    const stats = await this.walletService.getWalletStats(user.sub);

    return {
      balance: stats.balance,
      currency: stats.currency,
      total_earned: stats.total_earned,
      total_spent: stats.total_spent,
      total_transactions: stats.total_transactions,
    };
  }

  /**
   * POST /wallet/add-coins
   * Add coins to wallet (admin/system use)
   */
  @Post('add-coins')
  @HttpCode(HttpStatus.OK)
  async addCoins(
    @CurrentUser() user: RequestUser,
    @Body() addCoinsDto: AddCoinsDto,
  ) {
    this.logger.log(`Adding ${addCoinsDto.amount} coins to user: ${user.sub}`);

    const result = await this.walletService.addCoins(
      user.sub,
      addCoinsDto.amount,
      addCoinsDto.type,
      addCoinsDto.description,
    );

    return {
      message: 'Coins added successfully',
      balance: result.balance,
      transaction: {
        id: result.transaction.id,
        amount: result.transaction.amount,
        type: result.transaction.type,
        description: result.transaction.description,
        created_at: result.transaction.created_at,
      },
    };
  }

  /**
   * POST /wallet/spend-coins
   * Spend coins from wallet
   */
  @Post('spend-coins')
  @HttpCode(HttpStatus.OK)
  async spendCoins(
    @CurrentUser() user: RequestUser,
    @Body() spendCoinsDto: SpendCoinsDto,
  ) {
    this.logger.log(`Spending ${spendCoinsDto.amount} coins from user: ${user.sub}`);

    const result = await this.walletService.spendCoins(
      user.sub,
      spendCoinsDto.amount,
      spendCoinsDto.type || 'spent',
      spendCoinsDto.description,
    );

    return {
      message: 'Coins spent successfully',
      balance: result.balance,
      transaction: {
        id: result.transaction.id,
        amount: result.transaction.amount,
        type: result.transaction.type,
        description: result.transaction.description,
        created_at: result.transaction.created_at,
      },
    };
  }

  /**
   * GET /wallet/transactions
   * Get transaction history
   */
  @Get('transactions')
  async getTransactions(
    @CurrentUser() user: RequestUser,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    this.logger.debug(`Fetching transactions for user: ${user.sub}`);

    const transactions = await this.walletService.getTransactions(
      user.sub,
      limit,
      offset,
    );

    return {
      transactions: transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        balance_after: tx.balance_after,
        description: tx.description,
        metadata: tx.metadata,
        created_at: tx.created_at,
      })),
      count: transactions.length,
    };
  }

  /**
   * GET /wallet/referral
   * Get referral code and stats
   */
  @Get('referral')
  async getReferral(@CurrentUser() user: RequestUser) {
    this.logger.debug(`Fetching referral info for user: ${user.sub}`);

    const stats = await this.walletService.getReferralStats(user.sub);

    return {
      code: stats.code,
      link: `https://unifesto.app/signup?ref=${stats.code}`,
      total_referrals: stats.total_referrals,
      total_rewards: stats.total_rewards,
      pending_referrals: stats.pending_referrals,
      completed_referrals: stats.completed_referrals,
    };
  }

  /**
   * POST /wallet/referral/apply
   * Apply a referral code
   */
  @Post('referral/apply')
  @HttpCode(HttpStatus.OK)
  async applyReferral(
    @CurrentUser() user: RequestUser,
    @Body() applyReferralDto: ApplyReferralDto,
  ) {
    this.logger.log(`Applying referral code for user: ${user.sub}`);

    const referral = await this.walletService.applyReferralCode(
      user.sub,
      applyReferralDto.referralCode,
    );

    return {
      message: 'Referral code applied successfully',
      referral: {
        id: referral.id,
        referral_code: referral.referral_code,
        status: referral.status,
        reward_amount: referral.reward_amount,
        created_at: referral.created_at,
      },
    };
  }

  /**
   * GET /wallet/referral/history
   * Get referral history
   */
  @Get('referral/history')
  async getReferralHistory(@CurrentUser() user: RequestUser) {
    this.logger.debug(`Fetching referral history for user: ${user.sub}`);

    const referrals = await this.walletService.getReferralHistory(user.sub);

    return {
      referrals: referrals.map((ref) => ({
        id: ref.id,
        referral_code: ref.referral_code,
        status: ref.status,
        reward_amount: ref.reward_amount,
        rewarded_at: ref.rewarded_at,
        created_at: ref.created_at,
      })),
      count: referrals.length,
    };
  }

  /**
   * POST /wallet/redeem
   * Apply a redeem code
   */
  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  async applyRedeemCode(
    @CurrentUser() user: RequestUser,
    @Body() applyRedeemCodeDto: ApplyRedeemCodeDto,
  ) {
    this.logger.log(`Applying redeem code for user: ${user.sub}`);

    const result = await this.walletService.applyRedeemCode(
      user.sub,
      applyRedeemCodeDto.code,
    );

    return {
      message: result.message || 'Redeem code applied successfully',
      coin_amount: result.coin_amount,
      new_balance: result.new_balance,
    };
  }

  /**
   * GET /wallet/settings/referral-reward
   * Get referral reward amount
   */
  @Get('settings/referral-reward')
  async getReferralRewardSetting() {
    const value = await this.walletService.getSystemSetting('referral_reward_amount');
    return {
      referral_reward_amount: value || 25,
    };
  }
}
