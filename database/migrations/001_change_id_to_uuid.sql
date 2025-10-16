-- Migration: Change id from SERIAL (int4) to UUID
-- Run this in Supabase SQL Editor

-- Step 1: Add the UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Add a new UUID column
ALTER TABLE insider_trades ADD COLUMN id_new UUID DEFAULT gen_random_uuid();

-- Step 3: Populate the new UUID column for existing rows
UPDATE insider_trades SET id_new = gen_random_uuid() WHERE id_new IS NULL;

-- Step 4: Drop the old primary key constraint
ALTER TABLE insider_trades DROP CONSTRAINT insider_trades_pkey;

-- Step 5: Drop the old id column
ALTER TABLE insider_trades DROP COLUMN id;

-- Step 6: Rename the new column to id
ALTER TABLE insider_trades RENAME COLUMN id_new TO id;

-- Step 7: Set id as NOT NULL
ALTER TABLE insider_trades ALTER COLUMN id SET NOT NULL;

-- Step 8: Add the new primary key constraint
ALTER TABLE insider_trades ADD PRIMARY KEY (id);

-- Step 9: Update job_runs table if needed (currently no FK, but good for consistency)
-- Add UUID extension and change id
ALTER TABLE job_runs ADD COLUMN id_new UUID DEFAULT gen_random_uuid();
UPDATE job_runs SET id_new = gen_random_uuid() WHERE id_new IS NULL;
ALTER TABLE job_runs DROP CONSTRAINT job_runs_pkey;
ALTER TABLE job_runs DROP COLUMN id;
ALTER TABLE job_runs RENAME COLUMN id_new TO id;
ALTER TABLE job_runs ALTER COLUMN id SET NOT NULL;
ALTER TABLE job_runs ADD PRIMARY KEY (id);

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('insider_trades', 'job_runs') 
  AND column_name = 'id'
ORDER BY table_name;
