-- Local R2 uploads (FamilyPhoto)
CREATE TABLE IF NOT EXISTS family_photos (
  id            TEXT PRIMARY KEY,
  filename      TEXT NOT NULL,
  url           TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  taken_at      TIMESTAMPTZ NOT NULL,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by   TEXT NOT NULL DEFAULT 'me',
  tags          TEXT[] NOT NULL DEFAULT '{}',
  caption       TEXT,
  location      TEXT,
  size_bytes    INTEGER NOT NULL DEFAULT 0,
  width         INTEGER NOT NULL DEFAULT 0,
  height        INTEGER NOT NULL DEFAULT 0
);

-- Google Photos synced via Picker (stored in R2)
CREATE TABLE IF NOT EXISTS family_google_photos (
  id            TEXT PRIMARY KEY,
  url           TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  filename      TEXT NOT NULL,
  description   TEXT,
  taken_at      TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mime_type     TEXT NOT NULL DEFAULT 'image/jpeg',
  width         INTEGER NOT NULL DEFAULT 0,
  height        INTEGER NOT NULL DEFAULT 0,
  synced_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
