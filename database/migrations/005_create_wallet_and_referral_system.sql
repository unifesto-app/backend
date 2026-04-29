-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0 CHECK (balance >= 0),
  currency TEXT DEFAULT 'Uni Coins',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earned', 'spent', 'refund', 'referral_bonus', 'event_reward', 'purchase')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_amount INTEGER DEFAULT 25,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- Create referral_codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  total_referrals INTEGER DEFAULT 0,
  total_rewards INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wallets
CREATE POLICY "Users can view their own wallet"
  ON wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet"
  ON wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
  ON wallets FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for referrals
CREATE POLICY "Users can view referrals they're involved in"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can insert referrals"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referred_id);

CREATE POLICY "System can update referrals"
  ON referrals FOR UPDATE
  USING (true);

-- RLS Policies for referral_codes
CREATE POLICY "Users can view their own referral code"
  ON referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view referral codes for validation"
  ON referral_codes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own referral code"
  ON referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral code"
  ON referral_codes FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to automatically create wallet when user signs up
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, balance, currency)
  VALUES (NEW.id, 0, 'Uni Coins')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create wallet on user creation
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_wallet_for_new_user();

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code from first 8 chars of user_id + random 4 chars
    code := UPPER(SUBSTRING(user_id_param::TEXT, 1, 8));
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = code) INTO code_exists;
    
    IF NOT code_exists THEN
      EXIT;
    END IF;
    
    -- If exists, add random suffix
    code := code || FLOOR(RANDOM() * 10000)::TEXT;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to create referral code for new user
CREATE OR REPLACE FUNCTION create_referral_code_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
BEGIN
  new_code := generate_referral_code(NEW.id);
  
  INSERT INTO referral_codes (user_id, code, total_referrals, total_rewards, is_active)
  VALUES (NEW.id, new_code, 0, 0, TRUE)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create referral code on user creation
DROP TRIGGER IF EXISTS on_auth_user_created_referral_code ON auth.users;
CREATE TRIGGER on_auth_user_created_referral_code
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_referral_code_for_new_user();

-- Function to update wallet balance and create transaction
CREATE OR REPLACE FUNCTION update_wallet_balance(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_wallet_id UUID;
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get wallet and lock row
  SELECT id, balance INTO v_wallet_id, v_new_balance
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for user';
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_new_balance + p_amount;
  
  -- Check if balance would go negative
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Update wallet balance
  UPDATE wallets
  SET balance = v_new_balance, updated_at = NOW()
  WHERE id = v_wallet_id;
  
  -- Create transaction record
  INSERT INTO transactions (wallet_id, user_id, type, amount, balance_after, description, metadata)
  VALUES (v_wallet_id, p_user_id, p_type, p_amount, v_new_balance, p_description, p_metadata)
  RETURNING id INTO v_transaction_id;
  
  RETURN jsonb_build_object(
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance,
    'amount', p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE wallets IS 'User wallet balances';
COMMENT ON TABLE transactions IS 'Transaction history for all wallet operations';
COMMENT ON TABLE referrals IS 'Referral relationships between users';
COMMENT ON TABLE referral_codes IS 'Unique referral codes for each user';
COMMENT ON FUNCTION update_wallet_balance IS 'Atomically updates wallet balance and creates transaction record';
