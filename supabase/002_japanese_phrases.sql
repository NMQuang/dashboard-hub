-- supabase/002_japanese_phrases.sql
-- Japanese phrase storage for Onsite Best Practices tab.
-- Run once in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS japanese_phrases (
  id          TEXT        PRIMARY KEY,
  category    TEXT        NOT NULL,
  japanese    TEXT        NOT NULL,
  vietnamese  TEXT,
  note        TEXT,
  tags        TEXT[],
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_japanese_phrases_category
  ON japanese_phrases (category);

-- Index for time-ordered listing
CREATE INDEX IF NOT EXISTS idx_japanese_phrases_created_at
  ON japanese_phrases (created_at DESC);

-- Optional: restrict category values to the defined set
ALTER TABLE japanese_phrases
  ADD CONSTRAINT japanese_phrases_category_check
  CHECK (category IN (
    '会議', 'メール', '電話', '報告', '相談', '依頼', '謝罪', '確認'
  ));
