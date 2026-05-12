-- Family Finance Tables
-- Apply in Supabase Dashboard → SQL Editor → Run

-- Income from multiple sources (wife VN, husband VN, husband JP)
CREATE TABLE IF NOT EXISTS family_income (
  id            TEXT         PRIMARY KEY,
  source        TEXT         NOT NULL,
  country       TEXT         NOT NULL CHECK (country IN ('VN', 'JP')),
  currency      TEXT         NOT NULL CHECK (currency IN ('VND', 'JPY', 'USD')),
  amount        NUMERIC      NOT NULL,
  received_date DATE         NOT NULL,
  category      TEXT,
  note          TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_income_received_date
  ON family_income (received_date DESC);

-- Expenses for Vietnam and Japan
CREATE TABLE IF NOT EXISTS family_expenses (
  id              TEXT         PRIMARY KEY,
  country         TEXT         NOT NULL CHECK (country IN ('VN', 'JP')),
  category        TEXT         NOT NULL,
  amount          NUMERIC      NOT NULL,
  currency        TEXT         NOT NULL CHECK (currency IN ('VND', 'JPY')),
  spent_date      DATE         NOT NULL,
  payment_method  TEXT,
  note            TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_expenses_spent_date
  ON family_expenses (spent_date DESC);

-- Investment portfolio (gold + crypto)
CREATE TABLE IF NOT EXISTS family_investments (
  id                  TEXT         PRIMARY KEY,
  type                TEXT         NOT NULL CHECK (type IN ('gold', 'crypto')),
  asset_name          TEXT         NOT NULL,
  quantity            NUMERIC      NOT NULL,
  average_buy_price   NUMERIC,
  current_price       NUMERIC,
  currency            TEXT         NOT NULL,
  note                TEXT,
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
