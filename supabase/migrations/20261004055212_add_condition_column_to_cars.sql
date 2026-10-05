/*
# Add condition column to cars table

1. Modified Tables
- `cars`
  - Added `condition` (text, not null, default 'used') — 'new' | 'used'
2. Notes
- Existing cars default to 'used'.
- The column is included in public SELECT policies (already covered by existing SELECT * policies).
*/

ALTER TABLE cars ADD COLUMN IF NOT EXISTS condition text NOT NULL DEFAULT 'used';

-- Backfill existing rows
UPDATE cars SET condition = 'used' WHERE condition IS NULL;

CREATE INDEX IF NOT EXISTS idx_cars_condition ON cars(condition);
