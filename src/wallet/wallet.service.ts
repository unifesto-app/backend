import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';
import type {
  Wallet,
  Transaction,
  Referral,
  ReferralCode,
  WalletStats,
  ReferralStats,
} from './interfaces/wallet.interface';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly supabaseService: SupabaseService) { }

  /**
   * Get or create wallet for user
   */
  async getOrCreateWallet(userId: string): Promise<Wallet> {
    try {
      // Try to get existing wallet
      const { data: wallet, error } = await this.supabaseService
        .getClient()
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (wallet) {
        return wallet as Wallet;
      }

      // Create wallet if doesn't exist
      const { data: newWallet, error: createError } = await this.supabaseService
        .getClient()
        .from('wallets')
        .insert({
          user_id: userId,
          balance: 0,
          currency: 'Uni Coins',
        })
        .select()
        .single();

      if (createError) {
        this.logger.error(`Error creating wallet: ${createError.message}`);
        throw new InternalServerErrorException('Failed to create wallet');
      }

      this.logger.log(`Wallet created for user: ${userId}`);
      return newWallet as Wallet;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Unexpected error in getOrCreateWallet: ${error.message}`);
      throw new InternalServerErrorException('Failed to get or create wallet');
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(userId: string): Promise<{ balance: number; currency: string }> {
    try {
      const wallet = await this.getOrCreateWallet(userId);
      return {
        balance: wallet.balance,
        currency: wallet.currency,
      };
    } catch (error) {
      this.logger.error(`Error getting wallet balance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get wallet statistics
   */
  async getWalletStats(userId: string): Promise<WalletStats> {
    try {
      const wallet = await this.getOrCreateWallet(userId);

      // Get transaction statistics
      const { data: transactions, error } = await this.supabaseService
        .getClient()
        .from('transactions')
        .select('type, amount')
        .eq('user_id', userId);

      if (error) {
        this.logger.error(`Error fetching transactions: ${error.message}`);
        throw new InternalServerErrorException('Failed to fetch transaction stats');
      }

      const totalEarned = transactions
        ?.filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      const totalSpent = Math.abs(
        transactions
          ?.filter((t) => t.amount < 0)
          .reduce((sum, t) => sum + t.amount, 0) || 0
      );

      return {
        balance: wallet.balance,
        currency: wallet.currency,
        total_earned: totalEarned,
        total_spent: totalSpent,
        total_transactions: transactions?.length || 0,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Unexpected error in getWalletStats: ${error.message}`);
      throw new InternalServerErrorException('Failed to get wallet stats');
    }
  }

  /**
   * Add coins to wallet
   */
  async addCoins(
    userId: string,
    amount: number,
    type: string,
    description: string,
    metadata: Record<string, any> = {}
  ): Promise<{ balance: number; transaction: Transaction }> {
    try {
      // Call database function to update balance atomically
      const { data, error } = await this.supabaseService
        .getClient()
        .rpc('update_wallet_balance', {
          p_user_id: userId,
          p_amount: amount,
          p_type: type,
          p_description: description,
          p_metadata: metadata,
        });

      if (error) {
        this.logger.error(`Error adding coins: ${error.message}`);
        throw new InternalServerErrorException('Failed to add coins');
      }

      // Get transaction details
      const response = data as any[];
      const result = response[0];
      
      const { data: transaction, error: txError } = await this.supabaseService
        .getClient()
        .from('transactions')
        .select('*')
        .eq('id', result.transaction_id)
        .single();

      if (txError) {
        this.logger.error(`Error fetching transaction: ${txError.message}`);
      }

      this.logger.log(`Added ${amount} coins to user ${userId}`);

      return {
        balance: result.new_balance,
        transaction: transaction as Transaction,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Unexpected error in addCoins: ${error.message}`);
      throw new InternalServerErrorException('Failed to add coins');
    }
  }

  /**
   * Spend coins from wallet
   */
  async spendCoins(
    userId: string,
    amount: number,
    type: string,
    description: string,
    metadata: Record<string, any> = {}
  ): Promise<{ balance: number; transaction: Transaction }> {
    try {
      // Verify sufficient balance first
      const wallet = await this.getOrCreateWallet(userId);
      if (wallet.balance < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      // Call database function with negative amount
      const { data, error } = await this.supabaseService
        .getClient()
        .rpc('update_wallet_balance', {
          p_user_id: userId,
          p_amount: -amount,
          p_type: type,
          p_description: description,
          p_metadata: metadata,
        });

      if (error) {
        if (error.message.includes('Insufficient balance')) {
          throw new BadRequestException('Insufficient balance');
        }
        this.logger.error(`Error spending coins: ${error.message}`);
        throw new InternalServerErrorException('Failed to spend coins');
      }

      // Get transaction details
      const response = data as any[];
      const result = response[0];

      const { data: transaction, error: txError } = await this.supabaseService
        .getClient()
        .from('transactions')
        .select('*')
        .eq('id', result.transaction_id)
        .single();

      if (txError) {
        this.logger.error(`Error fetching transaction: ${txError.message}`);
      }

      this.logger.log(`Spent ${amount} coins from user ${userId}`);

      return {
        balance: result.new_balance,
        transaction: transaction as Transaction,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Unexpected error in spendCoins: ${error.message}`);
      throw new InternalServerErrorException('Failed to spend coins');
    }
  }

  /**
   * Get transaction history
   */
  async getTransactions(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Transaction[]> {
    try {
      const { data: transactions, error } = await this.supabaseService
        .getClient()
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        this.logger.error(`Error fetching transactions: ${error.message}`);
        throw new InternalServerErrorException('Failed to fetch transactions');
      }

      return (transactions || []) as Transaction[];
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Unexpected error in getTransactions: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch transactions');
    }
  }

  /**
   * Get or create referral code for user
   */
  async getOrCreateReferralCode(userId: string): Promise<ReferralCode> {
    try {
      // Try to get existing code
      const { data: code, error } = await this.supabaseService
        .getClient()
        .from('referral_codes')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (code) {
        return code as ReferralCode;
      }

      // Generate new code using database function
      const { data: newCodeText, error: genError } = await this.supabaseService
        .getClient()
        .rpc('generate_referral_code_from_username', { p_user_id: userId });

      if (genError) {
        this.logger.error(`Error generating referral code: ${genError.message}`);
        throw new InternalServerErrorException('Failed to generate referral code');
      }

      // Create referral code record
      const { data: newCode, error: createError } = await this.supabaseService
        .getClient()
        .from('referral_codes')
        .insert({
          user_id: userId,
          code: newCodeText,
          total_referrals: 0,
          total_rewards: 0,
          is_active: true,
        })
        .select()
        .single();

      if (createError) {
        this.logger.error(`Error creating referral code: ${createError.message}`);
        throw new InternalServerErrorException('Failed to create referral code');
      }

      this.logger.log(`Referral code created for user: ${userId}`);
      return newCode as ReferralCode;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Unexpected error in getOrCreateReferralCode: ${error.message}`);
      throw new InternalServerErrorException('Failed to get or create referral code');
    }
  }

  /**
   * Apply referral code
   */
  async applyReferralCode(userId: string, referralCode: string): Promise<Referral> {
    try {
      // Validate referral code exists
      const { data: codeData, error: codeError } = await this.supabaseService
        .getClient()
        .from('referral_codes')
        .select('*')
        .eq('code', referralCode.toUpperCase())
        .single();

      if (codeError || !codeData) {
        throw new BadRequestException('Invalid referral code');
      }

      if (!codeData.is_active) {
        throw new BadRequestException('Referral code is inactive');
      }

      const referrerId = codeData.user_id;

      // Check if user is trying to refer themselves
      if (referrerId === userId) {
        throw new BadRequestException('Cannot use your own referral code');
      }

      // Check if referral already exists
      const { data: existingReferral } = await this.supabaseService
        .getClient()
        .from('referrals')
        .select('id')
        .eq('referred_id', userId)
        .single();

      if (existingReferral) {
        throw new ConflictException('You have already used a referral code');
      }

      // Fetch dynamic settings (with fallback defaults)
      const referralRewardSetting = await this.getSystemSetting('referral_reward_amount');
      const welcomeBonusSetting = await this.getSystemSetting('welcome_bonus_amount');

      const referrerReward = referralRewardSetting !== null ? parseInt(referralRewardSetting.toString()) : 10;
      const newUserBonus = welcomeBonusSetting !== null ? parseInt(welcomeBonusSetting.toString()) : 25;

      // Create referral record
      const { data: referral, error: referralError } = await this.supabaseService
        .getClient()
        .from('referrals')
        .insert({
          referrer_id: referrerId,
          referred_id: userId,
          referral_code: referralCode.toUpperCase(),
          status: 'completed',
          reward_amount: referrerReward,
        })
        .select()
        .single();

      if (referralError) {
        this.logger.error(`Error creating referral: ${referralError.message}`);
        throw new InternalServerErrorException('Failed to apply referral code');
      }

      // Award coins to referrer
      if (referrerReward > 0) {
        await this.addCoins(
          referrerId,
          referrerReward,
          'referral_bonus',
          'Referral bonus',
          { referred_user_id: userId }
        );
      }

      // Award coins to new user (welcome bonus)
      if (newUserBonus > 0) {
        await this.addCoins(
          userId,
          newUserBonus,
          'welcome_bonus',
          'Welcome bonus from referral',
          { referrer_user_id: referrerId }
        );
      }

      // Update referral code stats
      await this.supabaseService
        .getClient()
        .from('referral_codes')
        .update({
          total_referrals: (codeData.total_referrals || 0) + 1,
          total_rewards: (codeData.total_rewards || 0) + referrerReward,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', referrerId);

      // Mark referral as rewarded
      await this.supabaseService
        .getClient()
        .from('referrals')
        .update({
          status: 'rewarded',
          rewarded_at: new Date().toISOString(),
        })
        .eq('id', referral.id);

      this.logger.log(`Referral applied: ${userId} referred by ${referrerId}`);

      return referral as Referral;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Unexpected error in applyReferralCode: ${error.message}`);
      throw new InternalServerErrorException('Failed to apply referral code');
    }
  }

  /**
   * Get referral statistics
   */
  async getReferralStats(userId: string): Promise<ReferralStats> {
    try {
      const referralCode = await this.getOrCreateReferralCode(userId);

      // Get referral counts by status
      const { data: referrals, error } = await this.supabaseService
        .getClient()
        .from('referrals')
        .select('status')
        .eq('referrer_id', userId);

      if (error) {
        this.logger.error(`Error fetching referrals: ${error.message}`);
        throw new InternalServerErrorException('Failed to fetch referral stats');
      }

      const pendingCount = referrals?.filter((r) => r.status === 'pending').length || 0;
      const completedCount = referrals?.filter((r) => r.status === 'completed' || r.status === 'rewarded').length || 0;

      return {
        code: referralCode.code,
        total_referrals: referralCode.total_referrals,
        total_rewards: referralCode.total_rewards,
        pending_referrals: pendingCount,
        completed_referrals: completedCount,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Unexpected error in getReferralStats: ${error.message}`);
      throw new InternalServerErrorException('Failed to get referral stats');
    }
  }

  /**
   * Get referral history
   */
  async getReferralHistory(userId: string): Promise<Referral[]> {
    try {
      const { data: referrals, error } = await this.supabaseService
        .getClient()
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error(`Error fetching referral history: ${error.message}`);
        throw new InternalServerErrorException('Failed to fetch referral history');
      }

      return (referrals || []) as Referral[];
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Unexpected error in getReferralHistory: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch referral history');
    }
  }

  /**
   * Apply redeem code
   */
  async applyRedeemCode(userId: string, code: string): Promise<any> {
    try {
      const { data, error } = await (this.supabaseService
        .getClient() as any)
        .rpc('apply_redeem_code', {
          p_user_id: userId,
          p_code: code.toUpperCase(),
        });

      if (error) {
        this.logger.error(`Error applying redeem code: ${error.message}`);

        if (error.message.includes('Invalid or inactive')) {
          throw new BadRequestException('Invalid or inactive redeem code');
        } else if (error.message.includes('expired')) {
          throw new BadRequestException('Redeem code has expired');
        } else if (error.message.includes('already used')) {
          throw new ConflictException('You have already used this redeem code');
        } else if (error.message.includes('maximum uses')) {
          throw new BadRequestException('Redeem code has reached maximum uses');
        }

        throw new InternalServerErrorException('Failed to apply redeem code');
      }

      this.logger.log(`Redeem code ${code} applied by user ${userId}`);
      return data;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Unexpected error in applyRedeemCode: ${error.message}`);
      throw new InternalServerErrorException('Failed to apply redeem code');
    }
  }

  /**
   * Get system setting
   */
  async getSystemSetting(key: string): Promise<any> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('system_settings')
        .select('value')
        .eq('key', key)
        .single();

      if (error || !data) {
        return null;
      }

      return data.value;
    } catch (error) {
      this.logger.error(`Error getting system setting: ${error.message}`);
      return null;
    }
  }

  /**
   * Update system setting
   */
  async updateSystemSetting(key: string, value: any, description?: string): Promise<any> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('system_settings')
        .upsert({
          key,
          value,
          description,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`Error updating system setting: ${error.message}`);
        throw new InternalServerErrorException('Failed to update system setting');
      }

      this.logger.log(`System setting ${key} updated`);
      return data;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Unexpected error in updateSystemSetting: ${error.message}`);
      throw new InternalServerErrorException('Failed to update system setting');
    }
  }

  /**
   * Admin: Get all wallets with pagination
   */
  async getAllWallets(query: any) {
    try {
      const { page = 1, limit = 10, minBalance, maxBalance, search } = query;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let dbQuery = this.supabaseService
        .getClient()
        .from('wallets')
        .select('*, profiles!inner(id, name, email, username)', { count: 'exact' });

      if (minBalance !== undefined) {
        dbQuery = dbQuery.gte('balance', minBalance);
      }

      if (maxBalance !== undefined) {
        dbQuery = dbQuery.lte('balance', maxBalance);
      }

      if (search) {
        dbQuery = dbQuery.or(`profiles.name.ilike.%${search}%,profiles.email.ilike.%${search}%,profiles.username.ilike.%${search}%`);
      }

      dbQuery = dbQuery
        .order('balance', { ascending: false })
        .range(from, to);

      const { data: wallets, error, count } = await dbQuery;

      if (error) {
        this.logger.error(`Error fetching wallets: ${error.message}`);
        throw new InternalServerErrorException('Failed to fetch wallets');
      }

      return {
        wallets: wallets || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Unexpected error in getAllWallets: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch wallets');
    }
  }

  /**
   * Admin: Get user wallet by user ID
   */
  async getUserWallet(userId: string) {
    try {
      const wallet = await this.getOrCreateWallet(userId);
      
      const { data: profile } = await this.supabaseService
        .getClient()
        .from('profiles')
        .select('id, name, email, username, avatar_url')
        .eq('id', userId)
        .single();

      return {
        ...wallet,
        user: profile,
      };
    } catch (error) {
      this.logger.error(`Unexpected error in getUserWallet: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch user wallet');
    }
  }

  /**
   * Admin: Create transaction for user
   */
  async adminCreateTransaction(userId: string, dto: any) {
    try {
      const { amount, type, description, metadata } = dto;

      if (amount > 0) {
        return await this.addCoins(userId, amount, type, description || 'Admin adjustment', metadata || {});
      } else {
        return await this.spendCoins(userId, Math.abs(amount), type, description || 'Admin adjustment', metadata || {});
      }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Unexpected error in adminCreateTransaction: ${error.message}`);
      throw new InternalServerErrorException('Failed to create transaction');
    }
  }
}
