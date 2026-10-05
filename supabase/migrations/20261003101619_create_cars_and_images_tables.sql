/*
# Create cars and car_images tables for dealership

1. New Tables
- `cars`
  - id (uuid, primary key)
  - brand (text, not null)
  - model (text, not null)
  - variant (text)
  - year (int, not null)
  - price (numeric, not null)
  - mileage (int)
  - fuel_type (text)
  - transmission (text)
  - engine (text)
  - color (text)
  - seating_capacity (int)
  - location (text)
  - description (text)
  - availability (text, default 'available') — 'available' | 'sold'
  - featured (boolean, default false)
  - created_at (timestamptz)
  - updated_at (timestamptz)
- `car_images`
  - id (uuid, primary key)
  - car_id (uuid FK → cars.id ON DELETE CASCADE)
  - storage_path (text, not null) — path in storage bucket
  - public_url (text, not null) — signed/public URL
  - label (text) — e.g. "Front", "Interior"
  - is_main (boolean, default false)
  - sort_order (int, default 0)
  - created_at (timestamptz)

2. Security
- Enable RLS on both tables.
- Public (anon, authenticated) can SELECT cars and images.
- Only authenticated admins can INSERT/UPDATE/DELETE.
  - Admin check: raw_app_meta_data->>'role' = 'admin'
- A trigger ensures at most one main image per car.
- A trigger updates updated_at on cars.

3. Storage
- Create a public bucket `car-images` for persistent image storage.
*/

CREATE TABLE IF NOT EXISTS cars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  model text NOT NULL,
  variant text DEFAULT '',
  year int NOT NULL,
  price numeric(12,2) NOT NULL,
  mileage int DEFAULT 0,
  fuel_type text DEFAULT '',
  transmission text DEFAULT '',
  engine text DEFAULT '',
  color text DEFAULT '',
  seating_capacity int DEFAULT 5,
  location text DEFAULT '',
  description text DEFAULT '',
  availability text NOT NULL DEFAULT 'available',
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- Public read
DROP POLICY IF EXISTS "public_read_cars" ON cars;
CREATE POLICY "public_read_cars" ON cars FOR SELECT
  TO anon, authenticated USING (true);

-- Admin write (role stored in app_meta_data)
DROP POLICY IF EXISTS "admin_insert_cars" ON cars;
CREATE POLICY "admin_insert_cars" ON cars FOR INSERT
  TO authenticated WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

DROP POLICY IF EXISTS "admin_update_cars" ON cars;
CREATE POLICY "admin_update_cars" ON cars FOR UPDATE
  TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

DROP POLICY IF EXISTS "admin_delete_cars" ON cars;
CREATE POLICY "admin_delete_cars" ON cars FOR DELETE
  TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- car_images
CREATE TABLE IF NOT EXISTS car_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  label text DEFAULT '',
  is_main boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE car_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_car_images" ON car_images;
CREATE POLICY "public_read_car_images" ON car_images FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_car_images" ON car_images;
CREATE POLICY "admin_insert_car_images" ON car_images FOR INSERT
  TO authenticated WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

DROP POLICY IF EXISTS "admin_update_car_images" ON car_images;
CREATE POLICY "admin_update_car_images" ON car_images FOR UPDATE
  TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

DROP POLICY IF EXISTS "admin_delete_car_images" ON car_images;
CREATE POLICY "admin_delete_car_images" ON car_images FOR DELETE
  TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_car_images_car_id ON car_images(car_id);
CREATE INDEX IF NOT EXISTS idx_cars_availability ON cars(availability);
CREATE INDEX IF NOT EXISTS idx_cars_brand ON cars(brand);

-- Trigger: updated_at on cars
CREATE OR REPLACE FUNCTION update_cars_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cars_updated_at ON cars;
CREATE TRIGGER trg_cars_updated_at BEFORE UPDATE ON cars
  FOR EACH ROW EXECUTE FUNCTION update_cars_updated_at();

-- Trigger: ensure only one main image per car
CREATE OR REPLACE FUNCTION ensure_single_main_image()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_main = true THEN
    UPDATE car_images SET is_main = false WHERE car_id = NEW.car_id AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ensure_single_main ON car_images;
CREATE TRIGGER trg_ensure_single_main BEFORE INSERT OR UPDATE ON car_images
  FOR EACH ROW EXECUTE FUNCTION ensure_single_main_image();

-- Storage bucket for car images (public so images load without signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('car-images', 'car-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, admin write
DROP POLICY IF EXISTS "public_read_car_images_storage" ON storage.objects;
CREATE POLICY "public_read_car_images_storage" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'car-images');

DROP POLICY IF EXISTS "admin_insert_car_images_storage" ON storage.objects;
CREATE POLICY "admin_insert_car_images_storage" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'car-images' AND auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

DROP POLICY IF EXISTS "admin_update_car_images_storage" ON storage.objects;
CREATE POLICY "admin_update_car_images_storage" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'car-images' AND auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

DROP POLICY IF EXISTS "admin_delete_car_images_storage" ON storage.objects;
CREATE POLICY "admin_delete_car_images_storage" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'car-images' AND auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
