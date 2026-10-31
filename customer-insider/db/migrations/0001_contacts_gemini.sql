ALTER TABLE submissions ADD COLUMN email TEXT;
--> statement-breakpoint
ALTER TABLE submissions ADD COLUMN report_status TEXT NOT NULL DEFAULT 'ready';
--> statement-breakpoint
ALTER TABLE submissions ADD COLUMN report_provider TEXT;
--> statement-breakpoint
ALTER TABLE submissions ADD COLUMN report_model TEXT;
--> statement-breakpoint
ALTER TABLE submissions ADD COLUMN report_started_at TEXT;
--> statement-breakpoint
CREATE INDEX submissions_email_idx ON submissions(email);
