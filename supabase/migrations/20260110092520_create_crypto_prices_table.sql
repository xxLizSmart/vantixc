/*
  # Cryptocurrency Prices Table

  ## Overview
  This migration creates a table to store real-time cryptocurrency prices used throughout
  the trading platform. Prices are updated regularly and used for trading calculations,
  portfolio valuations, and display purposes.

  ## Table: crypto_prices
  Stores current market prices for all supported cryptocurrencies
  - symbol (text, primary key) - Currency symbol (e.g., BTC, ETH, USDT)
  - name (text) - Full currency name (e.g., Bitcoin, Ethereum)
  - price_usd (numeric(20,8)) - Current price in USD with 8 decimal precision
  - price_change_24h (numeric) - 24-hour price change percentage
  - market_cap (numeric) - Market capitalization in USD
  - volume_24h (numeric) - 24-hour trading volume
  - circulating_supply (numeric) - Circulating supply amount
  - last_updated (timestamptz) - Last price update timestamp

  ## Security
  - RLS enabled
  - Public read access (all authenticated users can view prices)
  - Admin-only write access (only admins can update prices)

  ## Usage
  This table serves as the single source of truth for cryptocurrency prices across the platform.
  Prices should be updated regularly via admin panel or automated price feeds.
*/

-- Create crypto_prices table
CREATE TABLE IF NOT EXISTS crypto_prices (
  symbol text PRIMARY KEY,
  name text NOT NULL,
  price_usd numeric(20, 8) NOT NULL CHECK (price_usd >= 0),
  price_change_24h numeric DEFAULT 0,
  market_cap numeric DEFAULT 0,
  volume_24h numeric DEFAULT 0,
  circulating_supply numeric DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

-- Create index for faster price lookups
CREATE INDEX IF NOT EXISTS idx_crypto_prices_symbol ON crypto_prices(symbol);
CREATE INDEX IF NOT EXISTS idx_crypto_prices_updated ON crypto_prices(last_updated DESC);

-- Insert current cryptocurrency prices
INSERT INTO crypto_prices (symbol, name, price_usd, last_updated) VALUES
  ('BTC', 'Bitcoin', 90520.00, now()),
  ('ETH', 'Ethereum', 3085.61, now()),
  ('USDT', 'Tether', 1.00, now()),
  ('XRP', 'Ripple', 2.09, now()),
  ('BNB', 'BNB', 900.96, now()),
  ('SOL', 'Solana', 135.96, now()),
  ('USDC', 'USD Coin', 1.00, now()),
  ('TRX', 'TRON', 0.30, now()),
  ('DOGE', 'Dogecoin', 0.14, now()),
  ('ADA', 'Cardano', 0.39, now()),
  ('BCH', 'Bitcoin Cash', 635.77, now()),
  ('LINK', 'Chainlink', 13.14, now()),
  ('HYPE', 'Hyperliquid', 24.85, now()),
  ('LEO', 'LEO Token', 9.03, now()),
  ('XMR', 'Monero', 451.56, now())
ON CONFLICT (symbol) 
DO UPDATE SET 
  price_usd = EXCLUDED.price_usd,
  last_updated = EXCLUDED.last_updated;

-- Enable Row Level Security
ALTER TABLE crypto_prices ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view crypto prices (public read access)
CREATE POLICY "Anyone can view crypto prices"
  ON crypto_prices FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can insert crypto prices
CREATE POLICY "Admins can insert crypto prices"
  ON crypto_prices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Policy: Only admins can update crypto prices
CREATE POLICY "Admins can update crypto prices"
  ON crypto_prices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Policy: Only admins can delete crypto prices
CREATE POLICY "Admins can delete crypto prices"
  ON crypto_prices FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Function to update crypto price timestamp
CREATE OR REPLACE FUNCTION update_crypto_price_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp on price changes
DROP TRIGGER IF EXISTS update_crypto_price_timestamp_trigger ON crypto_prices;
CREATE TRIGGER update_crypto_price_timestamp_trigger
  BEFORE UPDATE ON crypto_prices
  FOR EACH ROW EXECUTE FUNCTION update_crypto_price_timestamp();

-- Create a view for portfolio valuation
CREATE OR REPLACE VIEW user_portfolio_value AS
SELECT 
  w.user_id,
  w.currency_symbol,
  w.balance,
  w.locked_balance,
  (w.balance + w.locked_balance) as total_balance,
  cp.price_usd,
  ((w.balance + w.locked_balance) * cp.price_usd) as value_usd
FROM wallets w
LEFT JOIN crypto_prices cp ON w.currency_symbol = cp.symbol;

-- Migration complete
