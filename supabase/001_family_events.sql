-- ═══════════════════════════════════════════════════════════════════════════
-- Family Plan — Supabase Table & Policies
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Create ENUM type for event categories ────────────────────────────

DO $$ BEGIN
  CREATE TYPE event_category AS ENUM (
    'flight',    -- lịch bay
    'visit',     -- về thăm nhà / bạn sang thăm
    'birthday',  -- sinh nhật
    'medical',   -- lịch bác sĩ con
    'holiday',   -- ngày nghỉ lễ
    'trip',      -- du lịch
    'vaccine',   -- lịch tiêm chủng bé
    'school',    -- trường học / nhà trẻ
    'other'
  );
EXCEPTION WHEN duplicate_object THEN
  NULL;  -- type already exists, skip
END $$;


-- ── 2. Create family_events table ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS family_events (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  category    event_category NOT NULL DEFAULT 'other',
  date        DATE NOT NULL,                    -- YYYY-MM-DD
  end_date    DATE,                             -- multi-day events
  time        TIME,                             -- HH:mm
  location    TEXT,
  reminder    INTEGER,                          -- days before reminder
  created_by  TEXT NOT NULL DEFAULT 'me'        -- 'me' | 'partner'
                CHECK (created_by IN ('me', 'partner')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_family_events_date     ON family_events (date);
CREATE INDEX IF NOT EXISTS idx_family_events_category ON family_events (category);


-- ── 3. Row Level Security (RLS) ─────────────────────────────────────────
-- Since we use service_role key (bypasses RLS), these are optional safety nets.

ALTER TABLE family_events ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (our Next.js API uses service_role key)
CREATE POLICY "service_role_full_access" ON family_events
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- ── 4. Helper view: upcoming events (next 60 days) ──────────────────────

CREATE OR REPLACE VIEW family_events_upcoming AS
SELECT *
FROM family_events
WHERE date >= CURRENT_DATE
  AND date <= CURRENT_DATE + INTERVAL '60 days'
ORDER BY date ASC, time ASC NULLS LAST;


-- ── 5. Helper view: past events (most recent 20) ────────────────────────

CREATE OR REPLACE VIEW family_events_past AS
SELECT *
FROM family_events
WHERE date < CURRENT_DATE
ORDER BY date DESC
LIMIT 20;


-- ── 6. (Optional) Seed sample data ─────────────────────────────────────
-- Uncomment below to pre-populate with sample events for your family.

/*
INSERT INTO family_events (id, title, category, date, end_date, location, created_by, description) VALUES
  ('evt_seed_001', 'Bay về Việt Nam thăm vợ con', 'flight', '2026-05-15', '2026-05-25', 'Narita → Tân Sơn Nhất', 'me', 'Chuyến bay về HCM 10 ngày'),
  ('evt_seed_002', 'Sinh nhật bé Cafe', 'birthday', '2026-06-12', NULL, 'Sài Gòn', 'partner', 'Sinh nhật 2 tuổi 🎂'),
  ('evt_seed_003', 'Tiêm chủng mũi 5 cho bé', 'vaccine', '2026-05-20', NULL, 'BV Nhi Đồng 1', 'partner', 'Tiêm phòng theo lịch'),
  ('evt_seed_004', 'Giỗ tổ Hùng Vương', 'holiday', '2026-04-26', NULL, NULL, 'me', 'Nghỉ lễ 10/3 âm lịch'),
  ('evt_seed_005', 'Lễ 30/4 - 1/5', 'holiday', '2026-04-30', '2026-05-01', NULL, 'me', 'Nghỉ lễ Giải phóng + Quốc tế Lao động')
ON CONFLICT (id) DO NOTHING;
*/


-- ═══════════════════════════════════════════════════════════════════════════
-- Done! Verify with:
--   SELECT * FROM family_events ORDER BY date;
--   SELECT * FROM family_events_upcoming;
-- ═══════════════════════════════════════════════════════════════════════════
