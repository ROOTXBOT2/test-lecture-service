-- Pattern Battle D1 Schema

CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    browser_id TEXT NOT NULL,
    nickname TEXT NOT NULL DEFAULT 'Anonymous',
    score INTEGER NOT NULL,
    max_combo INTEGER NOT NULL DEFAULT 0,
    accuracy REAL NOT NULL DEFAULT 0.0,
    rounds INTEGER NOT NULL DEFAULT 0,
    played_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Daily rankings: filter by date, sort by score
CREATE INDEX IF NOT EXISTS idx_scores_daily ON scores (played_at, score DESC);

-- All-time rankings: sort by score
CREATE INDEX IF NOT EXISTS idx_scores_alltime ON scores (score DESC);

-- Per-browser stats
CREATE INDEX IF NOT EXISTS idx_scores_browser ON scores (browser_id, score DESC);
