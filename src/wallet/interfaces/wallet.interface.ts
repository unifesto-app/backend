export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: 'earned' | 'spent' | 'refund' | 'referral_bonus' | 'event_reward' | 'purchase';
  amount: number;
  balance_after: number;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  status: 'pending' | 'completed' | 'rewarded';
  reward_amount: number;
  rewarded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  total_referrals: number;
  total_rewards: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletStats {
  balance: number;
  currency: string;
  total_earned: number;
  total_spent: number;
  total_transactions: number;
}

export interface ReferralStats {
  code: string;
  total_referrals: number;
  total_rewards: number;
  pending_referrals: number;
  completed_referrals: number;
}

export interface RedeemCode {
  id: string;
  code: string;
  type: 'promotional' | 'gift' | 'event' | 'partner';
  coin_amount: number;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  created_by: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RedeemCodeUse {
  id: string;
  redeem_code_id: string;
  user_id: string;
  coin_amount: number;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description: string | null;
  created_at: string;
  updated_at: string;
}
