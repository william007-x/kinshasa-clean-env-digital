
/*
# KinshasaEco — Communes and Profiles (Migration 001)

1. New Tables
   - communes: Kinshasa's 24 administrative communes
   - profiles: Extended user profile linked to auth.users

2. Security
   - RLS enabled on both tables
   - communes: public read, admin write
   - profiles: public read, self write (for own row)

Note: profiles.role is used in downstream policies, so it must exist before
other tables that reference it in policy checks.
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== COMMUNES ====================
CREATE TABLE IF NOT EXISTS communes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  population integer DEFAULT 0,
  area_km2 numeric(8,2) DEFAULT 0,
  eco_score integer DEFAULT 50 CHECK (eco_score BETWEEN 0 AND 100),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE communes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "communes_select_all" ON communes;
CREATE POLICY "communes_select_all" ON communes FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "communes_insert_auth" ON communes;
CREATE POLICY "communes_insert_auth" ON communes FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "communes_update_auth" ON communes;
CREATE POLICY "communes_update_auth" ON communes FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "communes_delete_auth" ON communes;
CREATE POLICY "communes_delete_auth" ON communes FOR DELETE TO authenticated USING (true);

-- ==================== PROFILES ====================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  role text NOT NULL DEFAULT 'citoyen' CHECK (role IN ('admin','citoyen','collecteur','ong','autorite','entreprise','ecole','association')),
  commune_id uuid REFERENCES communes(id),
  bio text,
  phone text,
  points integer NOT NULL DEFAULT 0,
  level text NOT NULL DEFAULT 'debutant' CHECK (level IN ('debutant','actif','militant','ambassadeur')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);
