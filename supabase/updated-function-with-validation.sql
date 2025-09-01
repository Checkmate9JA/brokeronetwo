-- Updated generate_dynamic_social_proof function with plan and trader validation
-- This function now checks actual investment plans, expert traders, and validates amounts

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
    random_plan RECORD;
    random_trader RECORD;
    final_text TEXT;
    random_amount DECIMAL;
    valid_amounts DECIMAL[];
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
    
    -- Get random investment plan from actual database
    SELECT * INTO random_plan
    FROM investment_plans
    WHERE is_active = true
    ORDER BY RANDOM()
    LIMIT 1;
    
    -- Get random expert trader from actual database
    SELECT * INTO random_trader
    FROM expert_traders
    WHERE is_active = true
    ORDER BY RANDOM()
    LIMIT 1;
    
    -- Generate random amount within plan limits
    IF random_plan.min_deposit IS NOT NULL AND random_plan.max_deposit IS NOT NULL THEN
        -- Generate amount within plan limits
        random_amount := random_plan.min_deposit + (random() * (random_plan.max_deposit - random_plan.min_deposit));
        -- Round to nearest 100 for realistic amounts
        random_amount := ROUND(random_amount / 100) * 100;
    ELSE
        -- Fallback amounts if plan limits not set
        valid_amounts := ARRAY[250, 500, 1200, 2500, 4500, 7800, 12000, 25000];
        random_amount := valid_amounts[1 + floor(random() * array_length(valid_amounts, 1))];
    END IF;
    
    -- Generate final text by replacing placeholders
    final_text := random_template.template_text;
    final_text := replace(final_text, '{name}', random_name.first_name || COALESCE(' ' || random_name.last_name, ''));
    final_text := replace(final_text, '{country}', random_name.country);
    final_text := replace(final_text, '{amount}', '$' || random_amount::TEXT);
    
    -- Replace plan placeholder with actual plan name
    IF final_text LIKE '%{plan}%' THEN
        final_text := replace(final_text, '{plan}', random_plan.name);
    END IF;
    
    -- Replace trader placeholder with actual trader name
    IF final_text LIKE '%{trader}%' THEN
        final_text := replace(final_text, '{trader}', random_trader.name);
    END IF;
    
    -- Replace symbol placeholder with random trading symbol
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
