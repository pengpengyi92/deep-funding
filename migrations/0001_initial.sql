CREATE TABLE workspaces (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, expires_at TEXT NOT NULL);
CREATE TABLE profiles (
  id TEXT PRIMARY KEY, owner TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK(kind IN ('company','funder')), version INTEGER NOT NULL,
  data TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX profiles_owner_kind ON profiles(owner, kind);
CREATE TABLE runs (
  id TEXT PRIMARY KEY, owner TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  data TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX runs_owner ON runs(owner);
CREATE TABLE matches (
  id TEXT PRIMARY KEY, owner TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL, funder_id TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX matches_owner ON matches(owner);
CREATE TABLE requests (
  id TEXT PRIMARY KEY, owner TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL, kind TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL,
  UNIQUE(owner, match_id, kind)
);
