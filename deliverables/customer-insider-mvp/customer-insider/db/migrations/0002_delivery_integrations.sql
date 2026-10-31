CREATE TABLE telegram_notifications (
  submission_id TEXT PRIMARY KEY NOT NULL REFERENCES submissions(id),
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TEXT,
  sent_at TEXT,
  message_id TEXT
);
--> statement-breakpoint
CREATE TABLE email_deliveries (
  id TEXT PRIMARY KEY NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TEXT,
  provider_id TEXT
);
