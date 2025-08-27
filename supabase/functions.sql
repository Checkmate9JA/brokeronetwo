-- Function to automatically update total_balance when wallet amounts change
CREATE OR REPLACE FUNCTION update_total_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total_balance to be the sum of all wallet amounts
    NEW.total_balance = COALESCE(NEW.deposit_wallet, 0) + 
                       COALESCE(NEW.profit_wallet, 0) + 
                       COALESCE(NEW.trading_wallet, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update total_balance
CREATE TRIGGER trigger_update_total_balance
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_total_balance();

-- Function to handle investment maturity
CREATE OR REPLACE FUNCTION handle_investment_maturity()
RETURNS TRIGGER AS $$
BEGIN
    -- If investment status changes to matured, calculate and add profit
    IF NEW.status = 'matured' AND OLD.status != 'matured' THEN
        -- Calculate profit earned
        NEW.profit_earned = NEW.amount_invested * (NEW.roi_percentage / 100);
        
        -- Update user's profit wallet
        UPDATE public.users 
        SET profit_wallet = profit_wallet + NEW.profit_earned
        WHERE email = NEW.user_email;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for investment maturity
CREATE TRIGGER trigger_handle_investment_maturity
    BEFORE UPDATE ON public.user_investments
    FOR EACH ROW
    EXECUTE FUNCTION handle_investment_maturity();

-- Function to handle transaction status changes
CREATE OR REPLACE FUNCTION handle_transaction_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If transaction is completed and it's a deposit, add to user's deposit wallet
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.type = 'deposit' THEN
        UPDATE public.users 
        SET deposit_wallet = deposit_wallet + NEW.amount
        WHERE email = NEW.user_email;
    END IF;
    
    -- If transaction is completed and it's a withdrawal, deduct from user's deposit wallet
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.type = 'withdrawal' THEN
        UPDATE public.users 
        SET deposit_wallet = deposit_wallet - NEW.amount
        WHERE email = NEW.user_email;
    END IF;
    
    -- If transaction is completed and it's a profit, add to user's profit wallet
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.type = 'profit' THEN
        UPDATE public.users 
        SET profit_wallet = profit_wallet + NEW.amount
        WHERE email = NEW.user_email;
    END IF;
    
    -- If transaction is completed and it's a bonus, add to user's referrer_bonus
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.type = 'bonus' THEN
        UPDATE public.users 
        SET referrer_bonus = referrer_bonus + NEW.amount
        WHERE email = NEW.user_email;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for transaction status changes
CREATE TRIGGER trigger_handle_transaction_status_change
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION handle_transaction_status_change();

-- Function to handle trading position updates
CREATE OR REPLACE FUNCTION handle_trading_position_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate profit/loss when current_price changes
    IF NEW.current_price IS NOT NULL AND NEW.entry_price IS NOT NULL THEN
        IF NEW.trade_direction = 'BUY' THEN
            -- Long position: profit when price goes up
            NEW.profit_loss_amount = (NEW.current_price - NEW.entry_price) * (NEW.investment_amount / NEW.entry_price);
            NEW.profit_loss_percentage = ((NEW.current_price - NEW.entry_price) / NEW.entry_price) * 100;
        ELSE
            -- Short position: profit when price goes down
            NEW.profit_loss_amount = (NEW.entry_price - NEW.current_price) * (NEW.investment_amount / NEW.entry_price);
            NEW.profit_loss_percentage = ((NEW.entry_price - NEW.current_price) / NEW.entry_price) * 100;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for trading position updates
CREATE TRIGGER trigger_handle_trading_position_update
    BEFORE UPDATE ON public.trading_positions
    FOR EACH ROW
    EXECUTE FUNCTION handle_trading_position_update();

-- Function to generate withdrawal codes
CREATE OR REPLACE FUNCTION generate_withdrawal_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_code BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 8-character alphanumeric code
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM public.users WHERE withdrawal_code = code) INTO exists_code;
        
        -- If code doesn't exist, return it
        IF NOT exists_code THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to create user profile after auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (email, full_name, role)
    VALUES (
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create user profile after auth signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Function to validate investment amount
CREATE OR REPLACE FUNCTION validate_investment_amount(
    p_plan_id UUID,
    p_amount NUMERIC
)
RETURNS BOOLEAN AS $$
DECLARE
    plan_min NUMERIC;
    plan_max NUMERIC;
BEGIN
    SELECT min_deposit, max_deposit INTO plan_min, plan_max
    FROM public.investment_plans
    WHERE id = p_plan_id AND is_active = true;
    
    IF plan_min IS NULL OR plan_max IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN p_amount >= plan_min AND p_amount <= plan_max;
END;
$$ LANGUAGE plpgsql;

-- Function to get user dashboard stats
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(p_user_email TEXT)
RETURNS TABLE(
    total_balance NUMERIC,
    deposit_wallet NUMERIC,
    profit_wallet NUMERIC,
    trading_wallet NUMERIC,
    active_investments_count BIGINT,
    total_invested NUMERIC,
    total_profit_earned NUMERIC,
    open_trades_count BIGINT,
    total_trades_pnl NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.total_balance,
        u.deposit_wallet,
        u.profit_wallet,
        u.trading_wallet,
        COUNT(ui.id)::BIGINT as active_investments_count,
        COALESCE(SUM(ui.amount_invested), 0) as total_invested,
        COALESCE(SUM(ui.profit_earned), 0) as total_profit_earned,
        COUNT(tp.id)::BIGINT as open_trades_count,
        COALESCE(SUM(tp.profit_loss_amount), 0) as total_trades_pnl
    FROM public.users u
    LEFT JOIN public.user_investments ui ON u.email = ui.user_email AND ui.status = 'active'
    LEFT JOIN public.trading_positions tp ON u.email = tp.user_email AND tp.status = 'open'
    WHERE u.email = p_user_email
    GROUP BY u.id, u.total_balance, u.deposit_wallet, u.profit_wallet, u.trading_wallet;
END;
$$ LANGUAGE plpgsql;

-- Function to handle user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (email, full_name, role)
  VALUES (NEW.email, NEW.raw_user_meta_data->>'full_name', 'user')
  ON CONFLICT (email) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile when auth.users gets a new user
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get user profile with authentication bypass
CREATE OR REPLACE FUNCTION public.get_user_profile(user_email TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role user_role,
  total_balance NUMERIC,
  deposit_wallet NUMERIC,
  profit_wallet NUMERIC,
  trading_wallet NUMERIC,
  referrer_bonus NUMERIC,
  is_suspended BOOLEAN,
  withdrawal_code TEXT,
  withdrawal_option TEXT,
  wallet_activated BOOLEAN,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id, u.email, u.full_name, u.role, u.total_balance, 
    u.deposit_wallet, u.profit_wallet, u.trading_wallet, 
    u.referrer_bonus, u.is_suspended, u.withdrawal_code, 
    u.withdrawal_option, u.wallet_activated, u.avatar_url, 
    u.created_at, u.updated_at
  FROM public.users u
  WHERE u.email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Allow new user registration" ON public.users;

-- Create new policies
-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.jwt() ->> 'email' = email);

-- Allow new user registration (this will be handled by the trigger)
CREATE POLICY "Allow new user registration" ON public.users
    FOR INSERT WITH CHECK (true);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Admins can update all users
CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );
