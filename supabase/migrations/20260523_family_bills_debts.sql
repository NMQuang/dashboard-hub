-- Bills (hóa đơn cố định JP chờ thanh toán)
CREATE TABLE IF NOT EXISTS family_bills (
  id               TEXT         PRIMARY KEY,
  month            TEXT         NOT NULL,        -- YYYY-MM
  country          TEXT         NOT NULL DEFAULT 'JP' CHECK (country IN ('JP', 'VN')),
  name             TEXT         NOT NULL,
  category         TEXT         NOT NULL DEFAULT 'utilities',
  estimated_amount NUMERIC,                      -- dự kiến
  actual_amount    NUMERIC,                      -- thực tế khi thanh toán
  currency         TEXT         NOT NULL DEFAULT 'JPY',
  due_date         DATE,
  status           TEXT         NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  expense_id       TEXT,                         -- FK → family_expenses.id sau khi trả
  note             TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_bills_month ON family_bills (month DESC);
CREATE INDEX IF NOT EXISTS idx_family_bills_status ON family_bills (status);

-- Công nợ (tôi nợ / người ta nợ tôi)
CREATE TABLE IF NOT EXISTS family_debts (
  id          TEXT         PRIMARY KEY,
  type        TEXT         NOT NULL CHECK (type IN ('owe', 'lend')), -- owe=tôi nợ, lend=người ta nợ
  person      TEXT         NOT NULL,
  amount      NUMERIC      NOT NULL,
  currency    TEXT         NOT NULL DEFAULT 'JPY',
  description TEXT,
  due_date    DATE,
  status      TEXT         NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'partial', 'settled')),
  paid_amount NUMERIC      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  settled_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_family_debts_status ON family_debts (status);
CREATE INDEX IF NOT EXISTS idx_family_debts_type   ON family_debts (type);
