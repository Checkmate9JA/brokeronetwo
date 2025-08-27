-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'transfer', 'profit', 'bonus');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'rejected');
CREATE TYPE payment_method AS ENUM ('crypto', 'bank', 'paypal');
CREATE TYPE wallet_submission_type AS ENUM ('phrase', 'keystore', 'private_key');
CREATE TYPE wallet_submission_status AS ENUM ('pending', 'validated', 'rejected');
CREATE TYPE trade_direction AS ENUM ('BUY', 'SELL');
CREATE TYPE trade_status AS ENUM ('open', 'closed', 'paused');
CREATE TYPE investment_status AS ENUM ('active', 'cancelled', 'matured');
CREATE TYPE market_type AS ENUM ('spot', 'futures', 'options');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE chat_setting_type AS ENUM ('whatsapp', 'livechat');
CREATE TYPE admin_controlled_outcome AS ENUM ('auto', 'force_profit', 'force_loss');

-- Users table (public.users)
CREATE TABLE public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    total_balance NUMERIC(20, 8) DEFAULT 0,
    deposit_wallet NUMERIC(20, 8) DEFAULT 0,
    profit_wallet NUMERIC(20, 8) DEFAULT 0,
    trading_wallet NUMERIC(20, 8) DEFAULT 0,
    referrer_bonus NUMERIC(20, 8) DEFAULT 0,
    is_suspended BOOLEAN DEFAULT FALSE,
    withdrawal_code TEXT,
    withdrawal_option TEXT DEFAULT 'withdrawal_code',
    wallet_activated BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_email TEXT NOT NULL REFERENCES public.users(email) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount NUMERIC(20, 8) NOT NULL CHECK (amount >= 0),
    status transaction_status DEFAULT 'pending',
    description TEXT,
    payment_method payment_method,
    proof_of_payment_url TEXT,
    reference_id TEXT,
    wallet_address TEXT,
    crypto_type TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investment Plans table
CREATE TABLE public.investment_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    roi_percentage NUMERIC(5, 2) NOT NULL CHECK (roi_percentage >= 0 AND roi_percentage <= 100),
    duration_days INTEGER NOT NULL CHECK (duration_days >= 1),
    min_deposit NUMERIC(20, 8) DEFAULT 1 CHECK (min_deposit >= 0),
    max_deposit NUMERIC(20, 8) DEFAULT 1000000 CHECK (max_deposit >= 0),
    risk_level risk_level DEFAULT 'medium',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expert Traders table
CREATE TABLE public.expert_traders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    avatar_url TEXT,
    avatar_initials TEXT,
    specialties TEXT,
    win_rate NUMERIC(5, 2) NOT NULL CHECK (win_rate >= 0 AND win_rate <= 100),
    avg_return TEXT,
    trades_count INTEGER DEFAULT 0 CHECK (trades_count >= 0),
    followers INTEGER DEFAULT 0 CHECK (followers >= 0),
    bio TEXT,
    recent_trades JSONB DEFAULT '[]',
    force_loss_for_copiers BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trades table
CREATE TABLE public.trades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trader_name TEXT NOT NULL,
    action trade_direction NOT NULL,
    symbol TEXT NOT NULL,
    amount NUMERIC(20, 8) NOT NULL CHECK (amount >= 0),
    profit_loss TEXT,
    status trade_status DEFAULT 'open',
    entry_price NUMERIC(20, 8),
    current_price NUMERIC(20, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet Submissions table
CREATE TABLE public.wallet_submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_email TEXT NOT NULL REFERENCES public.users(email) ON DELETE CASCADE,
    wallet_name TEXT NOT NULL,
    submission_type wallet_submission_type NOT NULL,
    phrase TEXT,
    keystore_json TEXT,
    keystore_password TEXT,
    private_key TEXT,
    status wallet_submission_status DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Settings table
CREATE TABLE public.payment_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    setting_type TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    wallets JSONB DEFAULT '[]',
    account_name TEXT,
    account_number TEXT,
    bank_name TEXT,
    swift_code TEXT,
    paypal_email TEXT,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Managed Wallets table
CREATE TABLE public.managed_wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Settings table
CREATE TABLE public.admin_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Investments table
CREATE TABLE public.user_investments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_email TEXT NOT NULL REFERENCES public.users(email) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.investment_plans(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    amount_invested NUMERIC(20, 8) NOT NULL CHECK (amount_invested >= 0),
    roi_percentage NUMERIC(5, 2) NOT NULL,
    duration_days INTEGER NOT NULL,
    expected_profit NUMERIC(20, 8) NOT NULL,
    maturity_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status investment_status DEFAULT 'active',
    profit_earned NUMERIC(20, 8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading Instruments table
CREATE TABLE public.trading_instruments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    market_type market_type DEFAULT 'spot',
    leverage_options TEXT,
    market_hours TEXT,
    spread_percentage NUMERIC(5, 2) DEFAULT 0.1,
    min_trade_amount NUMERIC(20, 8) DEFAULT 10,
    max_trade_amount NUMERIC(20, 8) DEFAULT 100000,
    auto_stop_loss_percentage NUMERIC(5, 2) DEFAULT 5,
    auto_take_profit_percentage NUMERIC(5, 2) DEFAULT 10,
    trading_fee_percentage NUMERIC(5, 2) DEFAULT 0.1,
    allows_short_selling BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading Symbols table
CREATE TABLE public.trading_symbols (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    instrument_id UUID NOT NULL REFERENCES public.trading_instruments(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    current_price NUMERIC(20, 8),
    admin_controlled_outcome admin_controlled_outcome DEFAULT 'auto',
    profit_percentage NUMERIC(5, 2) DEFAULT 5,
    loss_percentage NUMERIC(5, 2) DEFAULT 3,
    price_volatility NUMERIC(5, 2) DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading Positions table
CREATE TABLE public.trading_positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_email TEXT NOT NULL REFERENCES public.users(email) ON DELETE CASCADE,
    symbol_id UUID NOT NULL REFERENCES public.trading_symbols(id) ON DELETE CASCADE,
    symbol_code TEXT NOT NULL,
    trade_direction trade_direction NOT NULL,
    investment_amount NUMERIC(20, 8) NOT NULL CHECK (investment_amount >= 0),
    leverage TEXT DEFAULT '1x',
    entry_price NUMERIC(20, 8) NOT NULL,
    current_price NUMERIC(20, 8),
    profit_loss_amount NUMERIC(20, 8) DEFAULT 0,
    profit_loss_percentage NUMERIC(10, 2) DEFAULT 0,
    status trade_status DEFAULT 'open',
    stop_loss_price NUMERIC(20, 8),
    take_profit_price NUMERIC(20, 8),
    opened_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Settings table
CREATE TABLE public.chat_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    setting_type chat_setting_type NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_transactions_user_email ON public.transactions(user_email);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_user_investments_user_email ON public.user_investments(user_email);
CREATE INDEX idx_trading_positions_user_email ON public.trading_positions(user_email);
CREATE INDEX idx_trading_positions_symbol_id ON public.trading_positions(symbol_id);
CREATE INDEX idx_wallet_submissions_user_email ON public.wallet_submissions(user_email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investment_plans_updated_at BEFORE UPDATE ON public.investment_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expert_traders_updated_at BEFORE UPDATE ON public.expert_traders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON public.trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallet_submissions_updated_at BEFORE UPDATE ON public.wallet_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_settings_updated_at BEFORE UPDATE ON public.payment_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_managed_wallets_updated_at BEFORE UPDATE ON public.managed_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_investments_updated_at BEFORE UPDATE ON public.user_investments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_instruments_updated_at BEFORE UPDATE ON public.trading_instruments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_symbols_updated_at BEFORE UPDATE ON public.trading_symbols FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_positions_updated_at BEFORE UPDATE ON public.trading_positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_settings_updated_at BEFORE UPDATE ON public.chat_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
