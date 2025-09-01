-- =====================================================
-- SOCIAL PROOF SYSTEM SETUP
-- =====================================================

-- 1. Create the social_proof_activities table
CREATE TABLE IF NOT EXISTS social_proof_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_name VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    flag_emoji VARCHAR(10) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    activity_text TEXT NOT NULL,
    amount DECIMAL(15,2),
    currency VARCHAR(10) DEFAULT 'USD',
    related_entity_id UUID, -- For linking to investment plans, traders, etc.
    related_entity_type VARCHAR(50), -- 'investment_plan', 'expert_trader', 'symbol', etc.
    related_entity_name VARCHAR(100), -- Name of the related entity
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create the social_proof_names table for randomized names
CREATE TABLE IF NOT EXISTS social_proof_names (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50),
    country VARCHAR(100) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    flag_emoji VARCHAR(10) NOT NULL,
    region VARCHAR(50), -- 'Europe', 'Asia', 'Americas', 'Africa', 'Oceania'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create the social_proof_activity_templates table
CREATE TABLE IF NOT EXISTS social_proof_activity_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_type VARCHAR(50) NOT NULL,
    template_text TEXT NOT NULL,
    placeholder_count INTEGER DEFAULT 0,
    placeholders JSONB, -- Store placeholder info like {amount}, {plan}, {trader}
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1, -- Higher priority = more likely to be selected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_proof_activities_type ON social_proof_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_social_proof_activities_active ON social_proof_activities(is_active);
CREATE INDEX IF NOT EXISTS idx_social_proof_activities_created ON social_proof_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_social_proof_names_country ON social_proof_names(country);
CREATE INDEX IF NOT EXISTS idx_social_proof_names_active ON social_proof_names(is_active);
CREATE INDEX IF NOT EXISTS idx_social_proof_activity_templates_type ON social_proof_activity_templates(activity_type);
CREATE INDEX IF NOT EXISTS idx_social_proof_activity_templates_active ON social_proof_activity_templates(is_active);

-- 5. Create RLS policies
ALTER TABLE social_proof_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_proof_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_proof_activity_templates ENABLE ROW LEVEL SECURITY;

-- Policies for social_proof_activities
CREATE POLICY "Anyone can view social proof activities" ON social_proof_activities
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage social proof activities" ON social_proof_activities
    FOR ALL USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');

-- Policies for social_proof_names
CREATE POLICY "Anyone can view social proof names" ON social_proof_names
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage social proof names" ON social_proof_names
    FOR ALL USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');

-- Policies for social_proof_activity_templates
CREATE POLICY "Anyone can view activity templates" ON social_proof_activity_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage activity templates" ON social_proof_activity_templates
    FOR ALL USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');

-- 6. Insert sample names from different countries
INSERT INTO social_proof_names (first_name, last_name, country, country_code, flag_emoji, region) VALUES
-- Europe
('Stanley', 'Smith', 'London', 'GB', '🇬🇧', 'Europe'),
('Dana', 'Brownson', 'Stockholm', 'SE', '🇸🇪', 'Europe'),
('Ferdinand', NULL, 'Barcelona', 'ES', '🇪🇸', 'Europe'),
('Hans', 'Mueller', 'Berlin', 'DE', '🇩🇪', 'Europe'),
('Sophie', 'Dubois', 'Paris', 'FR', '🇫🇷', 'Europe'),
('Alessandro', 'Rossi', 'Milan', 'IT', '🇮🇹', 'Europe'),
('Carlos', 'Rodriguez', 'Madrid', 'ES', '🇪🇸', 'Europe'),
('Anna', 'Kowalski', 'Warsaw', 'PL', '🇵🇱', 'Europe'),
('Lars', 'Andersen', 'Copenhagen', 'DK', '🇩🇰', 'Europe'),
('Elena', 'Popov', 'Moscow', 'RU', '🇷🇺', 'Europe'),
('Isabella', 'Silva', 'Lisbon', 'PT', '🇵🇹', 'Europe'),
('Niklas', 'Berg', 'Helsinki', 'FI', '🇫🇮', 'Europe'),
('Marcus', 'Jensen', 'Oslo', 'NO', '🇳🇴', 'Europe'),
('Klara', 'Svensson', 'Gothenburg', 'SE', '🇸🇪', 'Europe'),
('Piotr', 'Nowak', 'Krakow', 'PL', '🇵🇱', 'Europe'),
('Maria', 'Kovac', 'Prague', 'CZ', '🇨🇿', 'Europe'),
('Jan', 'Hansen', 'Amsterdam', 'NL', '🇳🇱', 'Europe'),
('Eva', 'Schmidt', 'Vienna', 'AT', '🇦🇹', 'Europe'),
('Lucas', 'Bernard', 'Brussels', 'BE', '🇧🇪', 'Europe'),
('Sofia', 'Papadopoulos', 'Athens', 'GR', '🇬🇷', 'Europe'),

-- Americas
('Ronny', NULL, 'Rio de Janeiro', 'BR', '🇧🇷', 'Americas'),
('Maria', 'Santos', 'São Paulo', 'BR', '🇧🇷', 'Americas'),
('Carlos', 'Garcia', 'Mexico City', 'MX', '🇲🇽', 'Americas'),
('Isabella', 'Martinez', 'Buenos Aires', 'AR', '🇦🇷', 'Americas'),
('Diego', 'Lopez', 'Bogota', 'CO', '🇨🇴', 'Americas'),
('Ana', 'Fernandez', 'Lima', 'PE', '🇵🇪', 'Americas'),
('Javier', 'Torres', 'Santiago', 'CL', '🇨🇱', 'Americas'),
('Camila', 'Reyes', 'Caracas', 'VE', '🇻🇪', 'Americas'),
('Roberto', 'Silva', 'Montevideo', 'UY', '🇺🇾', 'Americas'),
('Gabriela', 'Morales', 'Quito', 'EC', '🇪🇨', 'Americas'),
('Miguel', 'Herrera', 'Guatemala City', 'GT', '🇬🇹', 'Americas'),
('Valentina', 'Castro', 'San Salvador', 'SV', '🇸🇻', 'Americas'),
('Ricardo', 'Mendoza', 'Tegucigalpa', 'HN', '🇭🇳', 'Americas'),
('Daniela', 'Vargas', 'Managua', 'NI', '🇳🇮', 'Americas'),
('Fernando', 'Rojas', 'Panama City', 'PA', '🇵🇦', 'Americas'),
('Adriana', 'Jimenez', 'San Jose', 'CR', '🇨🇷', 'Americas'),
('Alejandro', 'Moreno', 'Asuncion', 'PY', '🇵🇾', 'Americas'),
('Natalia', 'Gomez', 'La Paz', 'BO', '🇧🇴', 'Americas'),
('Sebastian', 'Ruiz', 'Sucre', 'BO', '🇧🇴', 'Americas'),
('Carolina', 'Diaz', 'Santo Domingo', 'DO', '🇩🇴', 'Americas'),

-- Asia
('Yuki', 'Tanaka', 'Tokyo', 'JP', '🇯🇵', 'Asia'),
('Jin', 'Park', 'Seoul', 'KR', '🇰🇷', 'Asia'),
('Priya', 'Patel', 'Mumbai', 'IN', '🇮🇳', 'Asia'),
('Ahmed', 'Hassan', 'Cairo', 'EG', '🇪🇬', 'Asia'),
('Zara', 'Khan', 'Dubai', 'AE', '🇦🇪', 'Asia'),
('Li', 'Wei', 'Beijing', 'CN', '🇨🇳', 'Asia'),
('Ming', 'Chen', 'Shanghai', 'CN', '🇨🇳', 'Asia'),
('Hiroshi', 'Yamamoto', 'Osaka', 'JP', '🇯🇵', 'Asia'),
('Min-ji', 'Kim', 'Busan', 'KR', '🇰🇷', 'Asia'),
('Arun', 'Kumar', 'Delhi', 'IN', '🇮🇳', 'Asia'),
('Fatima', 'Ali', 'Karachi', 'PK', '🇵🇰', 'Asia'),
('Hassan', 'Mahmoud', 'Tehran', 'IR', '🇮🇷', 'Asia'),
('Aisha', 'Rahman', 'Dhaka', 'BD', '🇧🇩', 'Asia'),
('Raj', 'Sharma', 'Bangalore', 'IN', '🇮🇳', 'Asia'),
('Nurul', 'Islam', 'Jakarta', 'ID', '🇮🇩', 'Asia'),
('Siti', 'Binti', 'Kuala Lumpur', 'MY', '🇲🇾', 'Asia'),
('Thi', 'Nguyen', 'Ho Chi Minh City', 'VN', '🇻🇳', 'Asia'),
('Boun', 'Souvanh', 'Vientiane', 'LA', '🇱🇦', 'Asia'),
('Sok', 'Chan', 'Phnom Penh', 'KH', '🇰🇭', 'Asia'),
('Kham', 'Souliya', 'Vientiane', 'LA', '🇱🇦', 'Asia'),

-- Oceania
('Emma', 'Wilson', 'Melbourne', 'AU', '🇦🇺', 'Oceania'),
('Liam', 'Thompson', 'Sydney', 'AU', '🇦🇺', 'Oceania'),
('Mia', 'Anderson', 'Brisbane', 'AU', '🇦🇺', 'Oceania'),
('Noah', 'White', 'Perth', 'AU', '🇦🇺', 'Oceania'),
('Ava', 'Martin', 'Adelaide', 'AU', '🇦🇺', 'Oceania'),
('James', 'Taylor', 'Auckland', 'NZ', '🇳🇿', 'Oceania'),
('Charlotte', 'Brown', 'Wellington', 'NZ', '🇳🇿', 'Oceania'),
('William', 'Davis', 'Christchurch', 'NZ', '🇳🇿', 'Oceania'),
('Sophia', 'Miller', 'Hamilton', 'NZ', '🇳🇿', 'Oceania'),
('Benjamin', 'Wilson', 'Tauranga', 'NZ', '🇳🇿', 'Oceania'),

-- Africa
('Kemi', 'Adebayo', 'Lagos', 'NG', '🇳🇬', 'Africa'),
('Kwame', 'Mensah', 'Accra', 'GH', '🇬🇭', 'Africa'),
('Amina', 'Diallo', 'Dakar', 'SN', '🇸🇳', 'Africa'),
('Thabo', 'Mokoena', 'Johannesburg', 'ZA', '🇿🇦', 'Africa'),
('Zainab', 'Omar', 'Nairobi', 'KE', '🇰🇪', 'Africa'),
('Kofi', 'Owusu', 'Kumasi', 'GH', '🇬🇭', 'Africa'),
('Fatou', 'Cisse', 'Bamako', 'ML', '🇲🇱', 'Africa'),
('Moussa', 'Traore', 'Ouagadougou', 'BF', '🇧🇫', 'Africa'),
('Aissatou', 'Diallo', 'Conakry', 'GN', '🇬🇳', 'Africa'),
('Mamadou', 'Bah', 'Freetown', 'SL', '🇸🇱', 'Africa');

-- 7. Insert activity templates
INSERT INTO social_proof_activity_templates (activity_type, template_text, placeholder_count, placeholders, priority) VALUES
-- Investment related
('investment', '{name} from {country} invested in {plan} just now', 3, '["name", "country", "plan"]', 10),
('investment', '{name} just started {plan} investment', 2, '["name", "plan"]', 8),
('investment', '{name} from {country} joined {plan} plan', 3, '["name", "country", "plan"]', 7),

-- Withdrawal related
('withdrawal', '{name} from {country} just withdrew earnings', 2, '["name", "country"]', 9),
('withdrawal', '{name} successfully withdrew {amount}', 2, '["name", "amount"]', 8),
('withdrawal', '{name} just cashed out {amount}', 2, '["name", "amount"]', 7),

-- Deposit related
('deposit', '{name} from {country} just deposited {amount}', 3, '["name", "country", "amount"]', 10),
('deposit', '{name} added {amount} to their account', 2, '["name", "amount"]', 8),
('deposit', '{name} just funded their wallet with {amount}', 2, '["name", "amount"]', 7),

-- Copy trading related
('copy_trade', '{name} from {country} just copied {trader}', 3, '["name", "country", "trader"]', 9),
('copy_trade', '{name} started following {trader}', 2, '["name", "trader"]', 8),
('copy_trade', '{name} just joined {trader} portfolio', 2, '["name", "trader"]', 7),

-- Profit related
('profit', '{name} earned {amount} profit', 2, '["name", "amount"]', 10),
('profit', '{name} from {country} just made {amount}', 3, '["name", "country", "amount"]', 9),
('profit', '{name} achieved {amount} in gains', 2, '["name", "amount"]', 8),

-- Trading related
('trade', '{name} opened {symbol} position', 2, '["name", "symbol"]', 9),
('trade', '{name} from {country} just traded {symbol}', 3, '["name", "country", "symbol"]', 8),
('trade', '{name} entered {symbol} market', 2, '["name", "symbol"]', 7),

-- Bonus related
('bonus', '{name} received welcome bonus', 1, '["name"]', 6),
('bonus', '{name} from {country} got signup bonus', 2, '["name", "country"]', 5),
('bonus', '{name} claimed referral bonus', 1, '["name"]', 4),

-- Referral related
('referral', '{name} invited a friend', 1, '["name"]', 6),
('referral', '{name} from {country} referred someone', 2, '["name", "country"]', 5),
('referral', '{name} just got referral reward', 1, '["name"]', 4),

-- Account related
('account', '{name} from {country} verified their account', 2, '["name", "country"]', 5),
('account', '{name} completed KYC process', 1, '["name"]', 4),
('account', '{name} upgraded to premium', 1, '["name"]', 6);

-- 8. Insert some sample recent activities
INSERT INTO social_proof_activities (user_name, country, country_code, flag_emoji, activity_type, activity_text, amount, related_entity_name, related_entity_type) VALUES
('Stanley Smith', 'London', 'GB', '🇬🇧', 'investment', 'Stanley Smith from London invested in Gold Plan just now', 5000, 'Gold Plan', 'investment_plan'),
('Dana Brownson', 'Stockholm', 'SE', '🇸🇪', 'withdrawal', 'Dana Brownson from Stockholm just withdrew earnings', 1200, NULL, NULL),
('Ferdinand', 'Barcelona', 'ES', '🇪🇸', 'copy_trade', 'Ferdinand from Barcelona just copied Alex Thompson', NULL, 'Alex Thompson', 'expert_trader'),
('Ronny', 'Rio de Janeiro', 'BR', '🇧🇷', 'deposit', 'Ronny from Rio de Janeiro just deposited $4500', 4500, NULL, NULL),
('Yuki Tanaka', 'Tokyo', 'JP', '🇯🇵', 'profit', 'Yuki Tanaka earned $2500 profit', 2500, NULL, NULL),
('Maria Santos', 'São Paulo', 'BR', '🇧🇷', 'trade', 'Maria Santos opened BTC/USD position', NULL, 'BTC/USD', 'symbol'),
('Hans Mueller', 'Berlin', 'DE', '🇩🇪', 'investment', 'Hans Mueller from Berlin joined Platinum Plan', 8000, 'Platinum Plan', 'investment_plan'),
('Sophie Dubois', 'Paris', 'FR', '🇫🇷', 'withdrawal', 'Sophie Dubois just withdrew $1800', 1800, NULL, NULL),
('Alessandro Rossi', 'Milan', 'IT', '🇮🇹', 'copy_trade', 'Alessandro Rossi started following Sarah Chen', NULL, 'Sarah Chen', 'expert_trader'),
('Emma Wilson', 'Melbourne', 'AU', '🇦🇺', 'deposit', 'Emma Wilson from Melbourne just deposited $3200', 3200, NULL, NULL);

-- 9. Create a function to get random social proof activities
CREATE OR REPLACE FUNCTION get_random_social_proof_activities(
    activity_type_filter VARCHAR DEFAULT NULL,
    limit_count INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    user_name VARCHAR,
    country VARCHAR,
    flag_emoji VARCHAR,
    activity_text TEXT,
    amount DECIMAL,
    currency VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        spa.id,
        spa.user_name,
        spa.country,
        spa.flag_emoji,
        spa.activity_text,
        spa.amount,
        spa.currency,
        spa.created_at
    FROM social_proof_activities spa
    WHERE spa.is_active = true
        AND (activity_type_filter IS NULL OR spa.activity_type = activity_type_filter)
    ORDER BY RANDOM()
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create a function to generate dynamic social proof
CREATE OR REPLACE FUNCTION generate_dynamic_social_proof(
    activity_type_filter VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    user_name VARCHAR,
    country VARCHAR,
    flag_emoji VARCHAR,
    activity_text TEXT,
    amount DECIMAL,
    currency VARCHAR
) AS $$
DECLARE
    random_name RECORD;
    random_template RECORD;
    final_text TEXT;
    random_amount DECIMAL;
    amounts DECIMAL[] := ARRAY[250, 500, 1200, 2500, 4500, 7800, 12000, 25000];
BEGIN
    -- Get random name
    SELECT * INTO random_name
    FROM social_proof_names
    WHERE is_active = true
    ORDER BY RANDOM()
    LIMIT 1;
    
    -- Get random template
    SELECT * INTO random_template
    FROM social_proof_activity_templates
    WHERE is_active = true
        AND (activity_type_filter IS NULL OR activity_type = activity_type_filter)
    ORDER BY RANDOM()
    LIMIT 1;
    
    -- Generate random amount
    random_amount := amounts[1 + floor(random() * array_length(amounts, 1))];
    
    -- Generate final text by replacing placeholders
    final_text := random_template.template_text;
    final_text := replace(final_text, '{name}', random_name.first_name || COALESCE(' ' || random_name.last_name, ''));
    final_text := replace(final_text, '{country}', random_name.country);
    final_text := replace(final_text, '{amount}', '$' || random_amount::TEXT);
    
    -- Replace other placeholders with random values
    IF final_text LIKE '%{plan}%' THEN
        final_text := replace(final_text, '{plan}', 
            (ARRAY['Gold Plan', 'Platinum Plan', 'Diamond Plan', 'Premium Plan', 'Elite Plan'])[1 + floor(random() * 5)]);
    END IF;
    
    IF final_text LIKE '%{trader}%' THEN
        final_text := replace(final_text, '{trader}', 
            (ARRAY['Alex Thompson', 'Sarah Chen', 'Mike Johnson', 'Lisa Wang', 'David Kim'])[1 + floor(random() * 5)]);
    END IF;
    
    IF final_text LIKE '%{symbol}%' THEN
        final_text := replace(final_text, '{symbol}', 
            (ARRAY['BTC/USD', 'ETH/USD', 'EUR/USD', 'GBP/USD', 'AAPL', 'TSLA', 'NVDA'])[1 + floor(random() * 7)]);
    END IF;
    
    RETURN QUERY SELECT
        (random_name.first_name || COALESCE(' ' || random_name.last_name, ''))::VARCHAR,
        random_name.country::VARCHAR,
        random_name.flag_emoji::VARCHAR,
        final_text,
        random_amount,
        'USD'
    FROM (SELECT 1) AS dummy;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Grant permissions
GRANT SELECT ON social_proof_activities TO anon;
GRANT SELECT ON social_proof_names TO anon;
GRANT SELECT ON social_proof_activity_templates TO anon;
GRANT EXECUTE ON FUNCTION get_random_social_proof_activities TO anon;
GRANT EXECUTE ON FUNCTION generate_dynamic_social_proof TO anon;

-- 12. Create a view for easy access
CREATE OR REPLACE VIEW social_proof_view AS
SELECT 
    spa.id,
    spa.user_name,
    spa.country,
    spa.country_code,
    spa.flag_emoji,
    spa.activity_type,
    spa.activity_text,
    spa.amount,
    spa.currency,
    spa.related_entity_name,
    spa.related_entity_type,
    spa.created_at,
    EXTRACT(EPOCH FROM (NOW() - spa.created_at)) / 60 as minutes_ago
FROM social_proof_activities spa
WHERE spa.is_active = true
ORDER BY spa.created_at DESC;

-- Grant access to the view
GRANT SELECT ON social_proof_view TO anon;

-- =====================================================
-- USAGE EXAMPLES:
-- =====================================================

-- Get random activities:
-- SELECT * FROM get_random_social_proof_activities();

-- Get random activities of specific type:
-- SELECT * FROM get_random_social_proof_activities('investment');

-- Generate dynamic social proof:
-- SELECT * FROM generate_dynamic_social_proof('deposit');

-- View all recent activities:
-- SELECT * FROM social_proof_view LIMIT 10;

-- =====================================================
-- MAINTENANCE QUERIES:
-- =====================================================

-- Clean up old activities (older than 30 days):
-- DELETE FROM social_proof_activities WHERE created_at < NOW() - INTERVAL '30 days';

-- Deactivate old names:
-- UPDATE social_proof_names SET is_active = false WHERE created_at < NOW() - INTERVAL '90 days';

-- Refresh activity timestamps:
-- UPDATE social_proof_activities SET created_at = NOW() - (RANDOM() * INTERVAL '2 hours') WHERE created_at < NOW() - INTERVAL '1 hour';
