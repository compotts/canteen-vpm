BEGIN;

CREATE TABLE IF NOT EXISTS daily_menus (
  date text PRIMARY KEY,
  sections jsonb NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_content (
  key text PRIMARY KEY,
  text_lt text NOT NULL DEFAULT '',
  text_ru text NOT NULL DEFAULT '',
  text_en text NOT NULL DEFAULT '',
  updated_by text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
