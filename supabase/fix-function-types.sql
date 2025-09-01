-- Fix the generate_dynamic_social_proof function type mismatch
-- Run this after the main social-proof-setup.sql script

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
            (ARRAY['BTC/USD', 'ETH/USD', 'EUR/USD', 'GBP/USD', 'AAPL', 'TSLA', 'NVDA'])[1 + floor(random() * 5)]);
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
