-- Add aliases column to redeem_codes if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'redeem_codes' 
    AND column_name = 'aliases'
  ) THEN 
    -- If alias exists from a previous step, drop it (optional cleanup)
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'redeem_codes' 
      AND column_name = 'alias'
    ) THEN
      ALTER TABLE redeem_codes DROP COLUMN alias;
    END IF;

    ALTER TABLE redeem_codes ADD COLUMN aliases TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Update the function to apply redeem code using either code or aliases array
CREATE OR REPLACE FUNCTION apply_redeem_code(
  p_user_id UUID,
  p_code TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_redeem_code redeem_codes;
  v_coin_amount INTEGER;
  v_result JSONB;
  v_transaction_id UUID;
  v_new_balance INTEGER;
BEGIN
  -- Get redeem code details by code OR if the code is in the aliases array
  SELECT * INTO v_redeem_code
  FROM redeem_codes
  WHERE (code = UPPER(p_code) OR UPPER(p_code) = ANY(aliases))
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

  -- Add coins to user's wallet (returns JSONB)
  v_result := update_wallet_balance(
    p_user_id,
    v_coin_amount,
    'earned',
    'Redeem code: ' || v_redeem_code.code,
    jsonb_build_object('redeem_code_id', v_redeem_code.id, 'code', v_redeem_code.code)
  );

  -- Extract values from JSONB result
  v_new_balance := (v_result->>'new_balance')::INTEGER;
  v_transaction_id := (v_result->>'transaction_id')::UUID;

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
