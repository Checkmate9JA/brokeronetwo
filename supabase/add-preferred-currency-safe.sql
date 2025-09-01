-- Safe add preferred_currency column to users table
DO $$ 
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'preferred_currency'
    ) THEN
        -- Add the column
        ALTER TABLE users ADD COLUMN preferred_currency VARCHAR(3) DEFAULT 'USD';
        
        -- Add a comment
        COMMENT ON COLUMN users.preferred_currency IS 'User preferred currency for trading and investments';
        
        RAISE NOTICE 'Added preferred_currency column to users table';
    ELSE
        RAISE NOTICE 'preferred_currency column already exists in users table';
    END IF;
END $$;

-- Update existing users to have USD as default if they don't have a preferred currency
UPDATE users 
SET preferred_currency = 'USD' 
WHERE preferred_currency IS NULL;

-- Add foreign key constraint to currencies table if it exists and constraint doesn't exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'currencies') THEN
        -- Check if the foreign key constraint already exists
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_users_preferred_currency' 
            AND table_name = 'users'
        ) THEN
            -- Add foreign key constraint
            ALTER TABLE users 
            ADD CONSTRAINT fk_users_preferred_currency 
            FOREIGN KEY (preferred_currency) 
            REFERENCES currencies(code);
            
            RAISE NOTICE 'Added foreign key constraint for preferred_currency';
        ELSE
            RAISE NOTICE 'Foreign key constraint fk_users_preferred_currency already exists';
        END IF;
    ELSE
        RAISE NOTICE 'currencies table does not exist, skipping foreign key constraint';
    END IF;
END $$;
