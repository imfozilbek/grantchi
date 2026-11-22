-- Opportunities: drafts from the collector, then moderated.
-- Filter columns are copied out of the card JSON so every WHERE / ORDER BY has an index.
CREATE TABLE opportunities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fingerprint TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected', 'expired')),
  source_id TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_published_at TEXT,
  collected_at TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  needs_check TEXT NOT NULL DEFAULT '[]',
  title_uz TEXT NOT NULL,
  type TEXT NOT NULL,
  deadline TEXT,
  card TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT,
  updated_at TEXT NOT NULL
);

-- Moderation queue: WHERE status = ? ORDER BY collected_at DESC, id DESC
CREATE INDEX opportunities_status_collected ON opportunities (status, collected_at DESC, id DESC);
-- Catalog and daily expiry: WHERE status = ? AND deadline ... ORDER BY deadline, id
CREATE INDEX opportunities_status_deadline ON opportunities (status, deadline, id);
-- Catalog filtered by type
CREATE INDEX opportunities_status_type_deadline ON opportunities (status, type, deadline, id);

-- AI quota use: one row per (provider, day), never one row per call.
CREATE TABLE ai_quota (
  provider TEXT NOT NULL,
  day TEXT NOT NULL,
  requests INTEGER NOT NULL DEFAULT 0,
  failures INTEGER NOT NULL DEFAULT 0,
  rate_limited INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (provider, day)
);
