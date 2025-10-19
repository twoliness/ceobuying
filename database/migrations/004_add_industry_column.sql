-- Add industry column to insider_trades table if it doesn't exist
-- Run this migration if your database doesn't have the industry column yet

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'insider_trades' 
        AND column_name = 'industry'
    ) THEN
        ALTER TABLE insider_trades 
        ADD COLUMN industry VARCHAR(255);
        
        RAISE NOTICE 'Added industry column to insider_trades table';
    ELSE
        RAISE NOTICE 'Industry column already exists in insider_trades table';
    END IF;
END $$;

-- Add an index for faster industry-based queries
CREATE INDEX IF NOT EXISTS idx_trades_industry ON insider_trades(industry);

COMMENT ON COLUMN insider_trades.industry IS 'Company industry/sector from SEC SIC codes';
