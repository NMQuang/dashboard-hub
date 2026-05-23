-- Bill templates: cấu hình các bill cố định tự động sinh ngày 25 hàng tháng
CREATE TABLE IF NOT EXISTS family_bill_templates (
  id               TEXT        PRIMARY KEY,
  country          TEXT        NOT NULL CHECK (country IN ('JP', 'VN')),
  name             TEXT        NOT NULL,
  category         TEXT        NOT NULL DEFAULT 'utilities',
  currency         TEXT        NOT NULL,
  estimated_amount NUMERIC,    -- null = dùng số thực tế tháng trước (smart estimate)
  enabled          BOOLEAN     NOT NULL DEFAULT true,
  sort_order       INT         NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (country, name)
);

INSERT INTO family_bill_templates (id, country, name, category, currency, enabled, sort_order) VALUES
  ('tpl-jp-denki',  'JP', '電気',               'utilities',      'JPY', true,  1),
  ('tpl-jp-suido',  'JP', '水道',               'utilities',      'JPY', true,  2),
  ('tpl-jp-gas',    'JP', 'ガス',               'utilities',      'JPY', true,  3),
  ('tpl-jp-net',    'JP', 'インターネット',      'utilities',      'JPY', true,  4),
  ('tpl-jp-wifi',   'JP', 'WiFi',               'utilities',      'JPY', true,  5),
  ('tpl-jp-food',   'JP', '食費',               'food',           'JPY', true,  6),
  ('tpl-vn-dien',   'VN', 'Tiền điện',          'utilities',      'VND', true,  7),
  ('tpl-vn-nuoc',   'VN', 'Tiền nước',          'utilities',      'VND', true,  8),
  ('tpl-vn-net',    'VN', 'Tiền internet',      'utilities',      'VND', true,  9),
  ('tpl-vn-visa',   'VN', 'Tiền trả VISA',      'misc',           'VND', true,  10),
  ('tpl-vn-bank',   'VN', 'Tiền trả ngân hàng', 'utilities',      'VND', true,  11),
  ('tpl-vn-xe',     'VN', 'Tiền xe',            'transportation', 'VND', true,  12)
ON CONFLICT (id) DO NOTHING;
