-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_traders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.managed_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Super admins can insert users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'super_admin'
        )
    );

-- Transactions table policies
CREATE POLICY "Users can view their own transactions" ON public.transactions
    FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can insert their own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Admins can view all transactions" ON public.transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update all transactions" ON public.transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Investment Plans table policies
CREATE POLICY "Everyone can view active investment plans" ON public.investment_plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all investment plans" ON public.investment_plans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can manage investment plans" ON public.investment_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Expert Traders table policies
CREATE POLICY "Everyone can view expert traders" ON public.expert_traders
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage expert traders" ON public.expert_traders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Trades table policies
CREATE POLICY "Everyone can view trades" ON public.trades
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage trades" ON public.trades
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Wallet Submissions table policies
CREATE POLICY "Users can view their own wallet submissions" ON public.wallet_submissions
    FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can insert their own wallet submissions" ON public.wallet_submissions
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Admins can view all wallet submissions" ON public.wallet_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update all wallet submissions" ON public.wallet_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Payment Settings table policies
CREATE POLICY "Everyone can view payment settings" ON public.payment_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage payment settings" ON public.payment_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Managed Wallets table policies
CREATE POLICY "Everyone can view managed wallets" ON public.managed_wallets
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage managed wallets" ON public.managed_wallets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Admin Settings table policies
CREATE POLICY "Only admins can access admin settings" ON public.admin_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );

-- User Investments table policies
CREATE POLICY "Users can view their own investments" ON public.user_investments
    FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can insert their own investments" ON public.user_investments
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Admins can view all investments" ON public.user_investments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update all investments" ON public.user_investments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Trading Instruments table policies
CREATE POLICY "Everyone can view active trading instruments" ON public.trading_instruments
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all trading instruments" ON public.trading_instruments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can manage trading instruments" ON public.trading_instruments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Trading Symbols table policies
CREATE POLICY "Everyone can view active trading symbols" ON public.trading_symbols
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all trading symbols" ON public.trading_symbols
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can manage trading symbols" ON public.trading_symbols
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Trading Positions table policies
CREATE POLICY "Users can view their own trading positions" ON public.trading_positions
    FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can insert their own trading positions" ON public.trading_positions
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can update their own trading positions" ON public.trading_positions
    FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Admins can view all trading positions" ON public.trading_positions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update all trading positions" ON public.trading_positions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Chat Settings table policies
CREATE POLICY "Everyone can view chat settings" ON public.chat_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage chat settings" ON public.chat_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role IN ('admin', 'super_admin')
        )
    );
