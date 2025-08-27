-- Insert initial users based on the provided credentials
-- Note: These users should already exist in auth.users from Supabase Auth
-- We're just creating their profiles in public.users

INSERT INTO public.users (email, full_name, role) VALUES
    ('creativeco9ja@gmail.com', 'Super Admin User', 'super_admin'),
    ('ledgercoinshield@gmail.com', 'Admin User', 'admin'),
    ('sabibroker@gmail.com', 'Regular User', 'user')
ON CONFLICT (email) DO NOTHING;

-- Insert sample investment plans
INSERT INTO public.investment_plans (name, roi_percentage, duration_days, min_deposit, max_deposit, risk_level, description) VALUES
    ('Starter Plan', 15.00, 30, 100, 10000, 'low', 'Perfect for beginners with low risk and steady returns'),
    ('Growth Plan', 25.00, 60, 500, 50000, 'medium', 'Balanced risk and reward for intermediate investors'),
    ('Premium Plan', 40.00, 90, 1000, 100000, 'high', 'High-risk, high-reward plan for experienced investors'),
    ('VIP Plan', 60.00, 120, 5000, 500000, 'high', 'Exclusive plan with maximum returns for VIP clients')
ON CONFLICT DO NOTHING;

-- Insert sample expert traders
INSERT INTO public.expert_traders (name, avatar_initials, specialties, win_rate, avg_return, trades_count, followers, bio) VALUES
    ('Alex Thompson', 'AT', 'Forex, Crypto', 78.50, '+15.2%', 1250, 8900, 'Professional trader with 8+ years experience in forex and cryptocurrency markets'),
    ('Sarah Chen', 'SC', 'Stocks, Options', 82.30, '+18.7%', 2100, 12400, 'Equity specialist focusing on tech stocks and options trading strategies'),
    ('Mike Rodriguez', 'MR', 'Commodities, Futures', 75.80, '+12.9%', 980, 6700, 'Commodities expert with deep knowledge of futures markets and hedging strategies')
ON CONFLICT DO NOTHING;

-- Insert sample trading instruments
INSERT INTO public.trading_instruments (name, description, icon, market_type, leverage_options, market_hours, spread_percentage, min_trade_amount, max_trade_amount) VALUES
    ('Forex', 'Foreign exchange currency pairs', '💱', 'spot', '1x,5x,10x,20x,50x,100x', '24/7', 0.05, 10, 100000),
    ('Cryptocurrency', 'Digital assets like Bitcoin, Ethereum', '₿', 'spot', '1x,5x,10x,20x,50x,100x', '24/7', 0.10, 10, 100000),
    ('Stocks', 'Equity shares of publicly traded companies', '📈', 'spot', '1x,2x,3x,5x', 'Mon-Fri 9:30-16:00', 0.15, 50, 100000),
    ('Commodities', 'Raw materials like gold, oil, silver', '🪙', 'futures', '1x,5x,10x,20x,50x', 'Mon-Fri 9:00-17:00', 0.20, 100, 100000)
ON CONFLICT DO NOTHING;

-- Insert sample trading symbols
INSERT INTO public.trading_symbols (instrument_id, symbol, name, current_price, price_volatility) 
SELECT 
    ti.id,
    'EUR/USD',
    'Euro / US Dollar',
    1.0850,
    1.5
FROM public.trading_instruments ti WHERE ti.name = 'Forex'
ON CONFLICT DO NOTHING;

INSERT INTO public.trading_symbols (instrument_id, symbol, name, current_price, price_volatility)
SELECT 
    ti.id,
    'BTC/USD',
    'Bitcoin / US Dollar',
    45000.00,
    3.0
FROM public.trading_instruments ti WHERE ti.name = 'Cryptocurrency'
ON CONFLICT DO NOTHING;

INSERT INTO public.trading_symbols (instrument_id, symbol, name, current_price, price_volatility)
SELECT 
    ti.id,
    'AAPL',
    'Apple Inc.',
    175.50,
    2.5
FROM public.trading_instruments ti WHERE ti.name = 'Stocks'
ON CONFLICT DO NOTHING;

-- Insert sample payment settings
INSERT INTO public.payment_settings (setting_type, is_enabled, wallets, instructions) VALUES
    ('crypto', true, '[{"name": "Bitcoin", "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"}, {"name": "Ethereum", "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"}]', 'Send only BTC/ETH to the addresses above. Minimum deposit: $10'),
    ('bank', true, NULL, 'Bank transfers may take 1-3 business days. Please include your email as reference.'),
    ('paypal', true, NULL, 'PayPal payments are processed instantly. Use the email: payments@brokerone.com')
ON CONFLICT DO NOTHING;

-- Insert sample managed wallets
INSERT INTO public.managed_wallets (name, icon_url, is_active) VALUES
    ('MetaMask', 'https://example.com/metamask-icon.png', true),
    ('Trust Wallet', 'https://example.com/trustwallet-icon.png', true),
    ('Coinbase Wallet', 'https://example.com/coinbase-icon.png', true),
    ('Binance Wallet', 'https://example.com/binance-icon.png', true)
ON CONFLICT DO NOTHING;

-- Insert sample chat settings
INSERT INTO public.chat_settings (setting_type, is_enabled, value) VALUES
    ('whatsapp', true, '+1234567890'),
    ('livechat', true, '<script src="https://example.com/livechat.js"></script>')
ON CONFLICT DO NOTHING;

-- Insert sample admin settings
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES
    ('maintenance_mode', 'false'),
    ('registration_enabled', 'true'),
    ('max_deposit_limit', '1000000'),
    ('min_withdrawal_limit', '10'),
    ('trading_enabled', 'true'),
    ('investment_enabled', 'true')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;
