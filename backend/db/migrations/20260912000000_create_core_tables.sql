CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  major TEXT NOT NULL,
  campus TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_draft BOOLEAN NOT NULL DEFAULT TRUE,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMP,
  completion_seconds INTEGER,
  anomaly_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  radar_data JSONB,
  tags JSONB,
  summary TEXT,
  priority_dimensions JSONB,
  ai_version JSONB,
  student_version JSONB,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
