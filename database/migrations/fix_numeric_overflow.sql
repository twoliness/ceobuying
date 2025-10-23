-- Fix numeric field overflow for delta_ownership and price_change_7d
-- Change from DECIMAL(5,2) to DECIMAL(10,2) to handle larger percentage values

ALTER TABLE insider_trades
  ALTER COLUMN delta_ownership TYPE DECIMAL(10, 2);

ALTER TABLE insider_trades
  ALTER COLUMN price_change_7d TYPE DECIMAL(10, 2);
