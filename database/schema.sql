-- CeoBuying Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Insider trades table
CREATE TABLE IF NOT EXISTS insider_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filing_date DATE NOT NULL,
  trade_date DATE NOT NULL,
  ticker VARCHAR(10) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(255),
  insider_name VARCHAR(255) NOT NULL,
  insider_title VARCHAR(255),
  transaction_type VARCHAR(10) NOT NULL, -- 'P' for purchase, 'S' for sale
  price DECIMAL(10, 2),
  quantity DECIMAL(15, 4) NOT NULL, -- supports fractional shares
  shares_owned_after DECIMAL(15, 4), -- supports fractional shares
  delta_ownership DECIMAL(5, 2), -- percentage change
  transaction_value DECIMAL(15, 2) NOT NULL,
  current_stock_price DECIMAL(10, 2),
  price_change_7d DECIMAL(5, 2), -- 7-day percentage change
  ai_summary TEXT, -- reserved for future AI integration
  is_cluster_buy BOOLEAN DEFAULT FALSE,
  cluster_count INTEGER DEFAULT 1,
  form_4_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT insider_trades_unique_trade UNIQUE(filing_date, trade_date, ticker, insider_name, transaction_type, transaction_value)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trades_filing_date ON insider_trades(filing_date DESC);
CREATE INDEX IF NOT EXISTS idx_trades_ticker ON insider_trades(ticker);
CREATE INDEX IF NOT EXISTS idx_trades_transaction_type ON insider_trades(transaction_type);
CREATE INDEX IF NOT EXISTS idx_trades_value ON insider_trades(transaction_value DESC);
CREATE INDEX IF NOT EXISTS idx_cluster_buys ON insider_trades(is_cluster_buy) WHERE is_cluster_buy = TRUE;

-- Scraper job runs table (optional - for monitoring)
CREATE TABLE IF NOT EXISTS job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(50) NOT NULL, -- 'scraper'
  status VARCHAR(20) NOT NULL, -- 'running', 'completed', 'failed'
  trades_processed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER update_insider_trades_updated_at BEFORE UPDATE ON insider_trades
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
