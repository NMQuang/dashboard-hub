-- supabase/003_japanese_phrases_extended.sql
-- Extends japanese_phrases with type, title, difficulty, category_vi columns.
-- Run AFTER 002_japanese_phrases.sql in the Supabase SQL editor.

ALTER TABLE japanese_phrases
  ADD COLUMN IF NOT EXISTS category_vi  TEXT,
  ADD COLUMN IF NOT EXISTS type         TEXT,
  ADD COLUMN IF NOT EXISTS title        TEXT,
  ADD COLUMN IF NOT EXISTS difficulty   TEXT;

-- Add type constraint (safe: checks before adding)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'japanese_phrases_type_check'
  ) THEN
    ALTER TABLE japanese_phrases
      ADD CONSTRAINT japanese_phrases_type_check
      CHECK (type IN ('sample_phrase', 'template', 'scenario_example') OR type IS NULL);
  END IF;
END;
$$;

-- Add difficulty constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'japanese_phrases_difficulty_check'
  ) THEN
    ALTER TABLE japanese_phrases
      ADD CONSTRAINT japanese_phrases_difficulty_check
      CHECK (difficulty IN ('basic', 'practical') OR difficulty IS NULL);
  END IF;
END;
$$;

-- Index for type + category filtering
CREATE INDEX IF NOT EXISTS idx_japanese_phrases_type
  ON japanese_phrases (type);
