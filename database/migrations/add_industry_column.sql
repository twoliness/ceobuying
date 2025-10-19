-- Add industry column to insider_trades table
ALTER TABLE insider_trades ADD COLUMN IF NOT EXISTS industry VARCHAR(255);
