/*
# Create enquiries table

1. New Tables
- `enquiries`
  - id (uuid, primary key)
  - car_id (uuid, nullable FK → cars.id ON DELETE SET NULL)
  - name (text, not null)
  - email (text, not null)
  - phone (text)
  - subject (text)
  - message (text)
  - status (text, default 'new') — 'new' | 'read' | 'responded'
  - created_at (timestamptz)

2. Security
- Enable RLS on enquiries.
- Anyone (anon, authenticated) can INSERT — visitors submit enquiries.
- Only authenticated admins can SELECT/UPDATE/DELETE.
*/

CREATE TABLE IF NOT EXISTS enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid REFERENCES cars(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT '',
  subject text DEFAULT '',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an enquiry
DROP POLICY IF EXISTS "public_insert_enquiries" ON enquiries;
CREATE POLICY "public_insert_enquiries" ON enquiries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Only admins can read enquiries
DROP POLICY IF EXISTS "admin_read_enquiries" ON enquiries;
CREATE POLICY "admin_read_enquiries" ON enquiries FOR SELECT
  TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Only admins can update enquiry status
DROP POLICY IF EXISTS "admin_update_enquiries" ON enquiries;
CREATE POLICY "admin_update_enquiries" ON enquiries FOR UPDATE
  TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Only admins can delete enquiries
DROP POLICY IF EXISTS "admin_delete_enquiries" ON enquiries;
CREATE POLICY "admin_delete_enquiries" ON enquiries FOR DELETE
  TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries(created_at DESC);
