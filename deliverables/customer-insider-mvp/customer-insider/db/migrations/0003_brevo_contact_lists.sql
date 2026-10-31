CREATE TABLE brevo_contact_sync (
  email TEXT NOT NULL,
  list_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TEXT,
  synced_at TEXT,
  PRIMARY KEY (email, list_id)
);
