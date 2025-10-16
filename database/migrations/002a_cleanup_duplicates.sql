-- Cleanup script: Remove duplicate/redundant records
-- Run this in Supabase SQL Editor BEFORE running migration 002

-- Step 1: View duplicates first (to see what will be deleted)
SELECT 
  filing_date, 
  trade_date, 
  ticker, 
  insider_name, 
  transaction_type,
  transaction_value,
  COUNT(*) as duplicate_count
FROM insider_trades
GROUP BY filing_date, trade_date, ticker, insider_name, transaction_type, transaction_value
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 2: Delete duplicates, keeping only the first record (oldest created_at)
DELETE FROM insider_trades a
USING insider_trades b
WHERE a.id > b.id
  AND a.filing_date = b.filing_date
  AND a.trade_date = b.trade_date
  AND a.ticker = b.ticker
  AND a.insider_name = b.insider_name
  AND a.transaction_type = b.transaction_type
  AND a.transaction_value = b.transaction_value;

-- Step 3: Delete records with empty insider names
DELETE FROM insider_trades
WHERE insider_name = 'EMPTY' OR insider_name = '' OR insider_name IS NULL;

-- Step 4: Show count after cleanup
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT ticker) as unique_tickers,
  COUNT(DISTINCT insider_name) as unique_insiders
FROM insider_trades;
