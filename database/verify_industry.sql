-- Verify industry column exists and check data
-- Run this in Supabase SQL Editor or via psql

-- 1. Check if industry column exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'insider_trades' 
    AND column_name = 'industry';

-- 2. Check how many trades have industry data
SELECT 
    COUNT(*) as total_trades,
    COUNT(industry) as trades_with_industry,
    COUNT(*) - COUNT(industry) as trades_without_industry,
    ROUND(100.0 * COUNT(industry) / COUNT(*), 2) as percentage_with_industry
FROM insider_trades;

-- 3. Show sample of trades with their industry
SELECT 
    ticker,
    company_name,
    industry,
    filing_date,
    transaction_value
FROM insider_trades
ORDER BY filing_date DESC
LIMIT 20;

-- 4. Show industry distribution
SELECT 
    industry,
    COUNT(*) as count
FROM insider_trades
WHERE industry IS NOT NULL
GROUP BY industry
ORDER BY count DESC
LIMIT 10;

-- 5. Show which tickers are missing industry data
SELECT 
    ticker,
    company_name,
    COUNT(*) as trade_count
FROM insider_trades
WHERE industry IS NULL
GROUP BY ticker, company_name
ORDER BY trade_count DESC
LIMIT 10;
