-- Create redeem_codes table for promotional/gift codes
CREATE TABLE IF NOT EXISTS redeem_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('promotional', 'gift', 'event', 'partner')),
  coin_amount INTEGER NOT NULL CHECK (coin_amount > 0),
  max_uses INTEGER DEFAULT NULL, -- NULL means unlimited
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create redeem_code_uses table to track who used which codes
CREATE TABLE IF NOT EXISTS redeem_code_uses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  redeem_code_id UUID NOT NULL REFERENCES redeem_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(redeem_code_id, user_id)
);

-- Create system_settings table for configurable values
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default referral reward setting
INSERT INTO system_settings (key, value, description)
VALUES (
  'referral_reward_amount',
  '25',
  'Number of coins awarded for each successful referral'
) ON CONFLICT (key) DO NOTHING;

-- Insert default welcome bonus setting
INSERT INTO system_settings (key, value, description)
VALUES (
  'welcome_bonus_amount',
  '25',
  'Number of coins awarded to new users who use a referral code'
) ON CONFLICT (key) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_redeem_codes_code ON redeem_codes(code);
CREATE INDEX IF NOT EXISTS idx_redeem_codes_is_active ON redeem_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_redeem_codes_expires_at ON redeem_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_redeem_code_uses_user_id ON redeem_code_uses(user_id);
CREATE INDEX IF NOT EXISTS idx_redeem_code_uses_redeem_code_id ON redeem_code_uses(redeem_code_id);

-- Enable RLS
ALTER TABLE redeem_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE redeem_code_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for redeem_codes
CREATE POLICY "Anyone can view active redeem codes"
  ON redeem_codes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage redeem codes"
  ON redeem_codes FOR ALL
  USING (true);

-- RLS Policies for redeem_code_uses
CREATE POLICY "Users can view their own redeem code uses"
  ON redeem_code_uses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own redeem code uses"
  ON redeem_code_uses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for system_settings
CREATE POLICY "Anyone can view system settings"
  ON system_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage system settings"
  ON system_settings FOR ALL
  USING (true);

-- Function to apply redeem code
CREATE OR REPLACE FUNCTION apply_redeem_code(
  p_user_id UUID,
  p_code TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_redeem_code redeem_codes;
  v_coin_amount INTEGER;
  v_transaction_id UUID;
  v_new_balance INTEGER;
BEGIN
  -- Get redeem code details
  SELECT * INTO v_redeem_code
  FROM redeem_codes
  WHERE code = UPPER(p_code)
  AND is_active = true
  FOR UPDATE;

  -- Validate code exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or inactive redeem code';
  END IF;

  -- Check if code has expired
  IF v_redeem_code.expires_at IS NOT NULL AND v_redeem_code.expires_at < NOW() THEN
    RAISE EXCEPTION 'Redeem code has expired';
  END IF;

  -- Check if user has already used this code
  IF EXISTS (
    SELECT 1 FROM redeem_code_uses
    WHERE redeem_code_id = v_redeem_code.id
    AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'You have already used this redeem code';
  END IF;

  -- Check if code has reached max uses
  IF v_redeem_code.max_uses IS NOT NULL AND v_redeem_code.current_uses >= v_redeem_code.max_uses THEN
    RAISE EXCEPTION 'Redeem code has reached maximum uses';
  END IF;

  v_coin_amount := v_redeem_code.coin_amount;

  -- Add coins to user's wallet
  SELECT new_balance, transaction_id INTO v_new_balance, v_transaction_id
  FROM update_wallet_balance(
    p_user_id,
    v_coin_amount,
    'earned',
    'Redeem code: ' || v_redeem_code.code,
    jsonb_build_object('redeem_code_id', v_redeem_code.id, 'code', v_redeem_code.code)
  );

  -- Record redeem code use
  INSERT INTO redeem_code_uses (redeem_code_id, user_id, coin_amount)
  VALUES (v_redeem_code.id, p_user_id, v_coin_amount);

  -- Update redeem code usage count
  UPDATE redeem_codes
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE id = v_redeem_code.id;

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'coin_amount', v_coin_amount,
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id,
    'message', 'Redeem code applied successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system setting value
CREATE OR REPLACE FUNCTION get_system_setting(p_key TEXT)
RETURNS JSONB AS $$
DECLARE
  v_value JSONB;
BEGIN
  SELECT value INTO v_value
  FROM system_settings
  WHERE key = p_key;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN v_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the referral application to use configurable reward amount
CREATE OR REPLACE FUNCTION apply_referral_with_configurable_reward(
  p_referrer_id UUID,
  p_referred_id UUID,
  p_referral_code TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_reward_amount INTEGER;
  v_welcome_bonus INTEGER;
  v_referral_id UUID;
  v_referrer_balance INTEGER;
  v_referred_balance INTEGER;
BEGIN
  -- Get configurable reward amounts
  v_reward_amount := COALESCE((get_system_setting('referral_reward_amount'))::INTEGER, 25);
  v_welcome_bonus := COALESCE((get_system_setting('welcome_bonus_amount'))::INTEGER, 25);

  -- Create referral record
  INSERT INTO referrals (referrer_id, referred_id, referral_code, status, reward_amount)
  VALUES (p_referrer_id, p_referred_id, p_referral_code, 'completed', v_reward_amount)
  RETURNING id INTO v_referral_id;

  -- Award coins to referrer
  SELECT new_balance INTO v_referrer_balance
  FROM update_wallet_balance(
    p_referrer_id,
    v_reward_amount,
    'referral_bonus',
    'Referral bonus',
    jsonb_build_object('referred_user_id', p_referred_id, 'referral_id', v_referral_id)
  );

  -- Award welcome bonus to referred user
  SELECT new_balance INTO v_referred_balance
  FROM update_wallet_balance(
    p_referred_id,
    v_welcome_bonus,
    'referral_bonus',
    'Welcome bonus from referral',
    jsonb_build_object('referrer_id', p_referrer_id, 'referral_id', v_referral_id)
  );

  -- Mark referral as rewarded
  UPDATE referrals
  SET status = 'rewarded',
      rewarded_at = NOW()
  WHERE id = v_referral_id;

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'referral_id', v_referral_id,
    'referrer_reward', v_reward_amount,
    'referred_bonus', v_welcome_bonus,
    'referrer_balance', v_referrer_balance,
    'referred_balance', v_referred_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
