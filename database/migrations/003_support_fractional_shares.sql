-- Migration: Change quantity and shares_owned_after to support fractional shares
-- Run this in Supabase SQL Editor

-- Step 1: Change quantity from INTEGER to NUMERIC to support fractional shares
ALTER TABLE insider_trades 
ALTER COLUMN quantity TYPE NUMERIC(15, 4);

-- Step 2: Change shares_owned_after from INTEGER to NUMERIC
ALTER TABLE insider_trades 
ALTER COLUMN shares_owned_after TYPE NUMERIC(15, 4);

-- Step 3: Verify the changes
SELECT 
  column_name, 
  data_type, 
  numeric_precision,
  numeric_scale
FROM information_schema.columns 
WHERE table_name = 'insider_trades' 
  AND column_name IN ('quantity', 'shares_owned_after');

-- Expected result:
-- quantity: numeric, precision=15, scale=4
-- shares_owned_after: numeric, precision=15, scale=4
