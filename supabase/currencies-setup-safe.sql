-- Safe currencies setup - won't throw errors if already exists
DO $$ 
BEGIN
    -- Create currencies table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'currencies') THEN
        CREATE TABLE currencies (
            id SERIAL PRIMARY KEY,
            code VARCHAR(3) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            symbol VARCHAR(10) NOT NULL,
            flag VARCHAR(10) NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created currencies table';
    ELSE
        RAISE NOTICE 'currencies table already exists';
    END IF;
END $$;

-- Insert currencies safely (won't duplicate)
INSERT INTO currencies (code, name, symbol, flag, is_active) VALUES
    ('USD', 'US Dollar', '$', '🇺🇸', true),
    ('EUR', 'Euro', '€', '🇪🇺', true),
    ('GBP', 'British Pound', '£', '🇬🇧', true),
    ('JPY', 'Japanese Yen', '¥', '🇯🇵', true),
    ('AUD', 'Australian Dollar', 'A$', '🇦🇺', true),
    ('CAD', 'Canadian Dollar', 'C$', '🇨🇦', true),
    ('CHF', 'Swiss Franc', 'CHF', '🇨🇭', true),
    ('CNY', 'Chinese Yuan', '¥', '🇨🇳', true),
    ('SEK', 'Swedish Krona', 'kr', '🇸🇪', true),
    ('NZD', 'New Zealand Dollar', 'NZ$', '🇳🇿', true),
    ('ZAR', 'South African Rand', 'R', '🇿🇦', true),
    ('NGN', 'Nigerian Naira', '₦', '🇳🇬', true),
    ('KES', 'Kenyan Shilling', 'KSh', '🇰🇪', true),
    ('MXN', 'Mexican Peso', '$', '🇲🇽', true),
    ('SGD', 'Singapore Dollar', 'S$', '🇸🇬', true),
    ('HKD', 'Hong Kong Dollar', 'HK$', '🇭🇰', true),
    ('NOK', 'Norwegian Krone', 'kr', '🇳🇴', true),
    ('KRW', 'South Korean Won', '₩', '🇰🇷', true),
    ('TRY', 'Turkish Lira', '₺', '🇹🇷', true),
    ('RUB', 'Russian Ruble', '₽', '🇷🇺', true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    symbol = EXCLUDED.symbol,
    flag = EXCLUDED.flag,
    updated_at = NOW();

-- Enable RLS safely
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

-- Create policies safely (drop if exists first)
DO $$ 
BEGIN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Allow authenticated users to read currencies" ON currencies;
    DROP POLICY IF EXISTS "Allow admins to manage currencies" ON currencies;
    DROP POLICY IF EXISTS "Allow authenticated users to manage currencies" ON currencies;
    
    -- Create new policies (using secure approach without self-reference prevention)
    CREATE POLICY "Allow authenticated users to read currencies" ON currencies
        FOR SELECT USING (auth.role() = 'authenticated');
    
    -- Allow admins to manage currencies (using secure approach)
    CREATE POLICY "Allow admins to manage currencies" ON currencies
        FOR ALL USING (
            auth.uid() IN (
                SELECT id FROM users WHERE role IN ('admin', 'super_admin')
            )
        );
    
    RAISE NOTICE 'Created/updated RLS policies for currencies table';
END $$;

-- Create functions safely
CREATE OR REPLACE FUNCTION get_currency_by_code(currency_code VARCHAR(3))
RETURNS currencies AS $$
BEGIN
    RETURN (
        SELECT * FROM currencies 
        WHERE code = currency_code AND is_active = true
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_active_currencies()
RETURNS SETOF currencies AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM currencies 
    WHERE is_active = true 
    ORDER BY code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Final success message
DO $$ 
BEGIN
    RAISE NOTICE 'Currencies setup completed successfully!';
END $$;
