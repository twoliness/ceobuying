-- Migration: Improve unique constraint to prevent duplicates
-- Run this in Supabase SQL Editor

-- Step 1: Drop the old unique constraint
ALTER TABLE insider_trades 
DROP CONSTRAINT IF EXISTS insider_trades_filing_date_ticker_insider_name_transaction_key;

-- Step 2: Add a better unique constraint that includes trade_date
-- This prevents the same trade from being inserted multiple times
ALTER TABLE insider_trades 
ADD CONSTRAINT insider_trades_unique_trade 
UNIQUE (filing_date, trade_date, ticker, insider_name, transaction_type, transaction_value);

-- Step 3: Create an index to speed up duplicate checking
CREATE INDEX IF NOT EXISTS idx_trades_duplicate_check 
ON insider_trades(filing_date, trade_date, ticker, insider_name, transaction_type, transaction_value);

-- Verify the new constraint
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'insider_trades'::regclass
  AND contype = 'u';
