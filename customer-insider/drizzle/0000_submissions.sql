CREATE TABLE submissions (
  id TEXT PRIMARY KEY NOT NULL,
  access_token TEXT NOT NULL,
  created_at TEXT NOT NULL,
  answers_json TEXT NOT NULL,
  report_json TEXT NOT NULL,
  storage_consent_at TEXT NOT NULL,
  consent_version TEXT NOT NULL DEFAULT '2026-10-28-v1'
);
--> statement-breakpoint
CREATE INDEX submissions_created_idx ON submissions(created_at, id);
--> statement-breakpoint
CREATE TABLE email_requests (
  id TEXT PRIMARY KEY NOT NULL,
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  recipient TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  consent_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested',
  provider_id TEXT
);
--> statement-breakpoint
CREATE INDEX email_requests_submission_idx ON email_requests(submission_id, requested_at);
