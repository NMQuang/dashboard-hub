-- Add purchased_at to track when gold/crypto/stock was bought
ALTER TABLE family_investments
  ADD COLUMN IF NOT EXISTS purchased_at DATE DEFAULT CURRENT_DATE;
