CREATE TABLE plan_requests (
  submission_id TEXT PRIMARY KEY NOT NULL REFERENCES submissions(id),
  status TEXT NOT NULL DEFAULT 'pending',
  updated_at TEXT NOT NULL
);
