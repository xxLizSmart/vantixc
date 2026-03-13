-- Extend trade_settings table with missing columns
ALTER TABLE trade_settings
  ADD COLUMN IF NOT EXISTS label         text,
  ADD COLUMN IF NOT EXISTS max_capital   numeric DEFAULT 10000,
  ADD COLUMN IF NOT EXISTS is_enabled    boolean DEFAULT true;

-- Seed / upsert all 8 durations
INSERT INTO trade_settings (duration, label, min_capital, max_capital, win_percentage, loss_percentage, is_enabled)
VALUES
  (30,    '30 Seconds', 1,   500,   82, 100, true),
  (60,    '1 Minute',   1,   1000,  85, 100, true),
  (180,   '3 Minutes',  5,   2000,  87, 100, true),
  (300,   '5 Minutes',  5,   5000,  88, 100, true),
  (900,   '15 Minutes', 10,  10000, 90, 100, true),
  (1800,  '30 Minutes', 10,  10000, 92, 100, true),
  (3600,  '1 Hour',     20,  20000, 93, 100, false),
  (14400, '4 Hours',    50,  50000, 95, 100, false)
ON CONFLICT (duration) DO UPDATE SET
  label           = EXCLUDED.label,
  min_capital     = EXCLUDED.min_capital,
  max_capital     = EXCLUDED.max_capital,
  win_percentage  = EXCLUDED.win_percentage,
  loss_percentage = EXCLUDED.loss_percentage,
  is_enabled      = EXCLUDED.is_enabled;

-- Allow admin to read/write trade_settings (RLS)
ALTER TABLE trade_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage trade_settings" ON trade_settings;
CREATE POLICY "Admin can manage trade_settings"
  ON trade_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Anyone can read trade_settings" ON trade_settings;
CREATE POLICY "Anyone can read trade_settings"
  ON trade_settings FOR SELECT
  USING (true);
