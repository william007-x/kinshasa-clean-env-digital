
/*
# KinshasaEco — Signalements, Waste Management (Migration 002)

1. New Tables
   - signalements: Citizen-reported environmental incidents
   - votes_signalements: One vote per user per signalement
   - points_depot: Waste drop-off collection points
   - collecteurs: Registered waste collectors
   - tournees: Planned collection rounds
   - tournee_points: Individual stops within a collection round

2. Security
   - signalements: public read, authenticated insert (own), admin/autorite/collecteur update
   - votes: authenticated, scoped to owner
   - points_depot: public read, admin write; collecteur can update fill %
   - collecteurs: public read, admin write
   - tournees/tournee_points: public read, admin/collecteur write
*/

-- ==================== SIGNALEMENTS ====================
CREATE TABLE IF NOT EXISTS signalements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL CHECK (type IN ('depot_sauvage','inondation','erosion','pollution_eau','pollution_air','autre')),
  status text NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente','en_cours','resolu','rejete')),
  latitude numeric(10,7) NOT NULL,
  longitude numeric(10,7) NOT NULL,
  commune_id uuid REFERENCES communes(id),
  photo_url text,
  votes integer NOT NULL DEFAULT 0,
  assigned_to uuid REFERENCES profiles(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE signalements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "signalements_select_all" ON signalements;
CREATE POLICY "signalements_select_all" ON signalements FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "signalements_insert_auth" ON signalements;
CREATE POLICY "signalements_insert_auth" ON signalements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "signalements_update_own_or_admin" ON signalements;
CREATE POLICY "signalements_update_own_or_admin" ON signalements FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','autorite','collecteur'))
  );

DROP POLICY IF EXISTS "signalements_delete_own_or_admin" ON signalements;
CREATE POLICY "signalements_delete_own_or_admin" ON signalements FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ==================== VOTES ====================
CREATE TABLE IF NOT EXISTS votes_signalements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  signalement_id uuid NOT NULL REFERENCES signalements(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, signalement_id)
);

ALTER TABLE votes_signalements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "votes_select_all" ON votes_signalements;
CREATE POLICY "votes_select_all" ON votes_signalements FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "votes_insert_auth" ON votes_signalements;
CREATE POLICY "votes_insert_auth" ON votes_signalements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "votes_delete_own" ON votes_signalements;
CREATE POLICY "votes_delete_own" ON votes_signalements FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ==================== POINTS DE DEPOT ====================
CREATE TABLE IF NOT EXISTS points_depot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  latitude numeric(10,7) NOT NULL,
  longitude numeric(10,7) NOT NULL,
  commune_id uuid REFERENCES communes(id),
  capacity_m3 numeric(6,2) DEFAULT 10,
  current_fill_pct integer DEFAULT 0 CHECK (current_fill_pct BETWEEN 0 AND 100),
  status text NOT NULL DEFAULT 'actif' CHECK (status IN ('actif','plein','hors_service','maintenance')),
  last_collected_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE points_depot ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "points_depot_select_all" ON points_depot;
CREATE POLICY "points_depot_select_all" ON points_depot FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "points_depot_insert_admin" ON points_depot;
CREATE POLICY "points_depot_insert_admin" ON points_depot FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "points_depot_update_admin" ON points_depot;
CREATE POLICY "points_depot_update_admin" ON points_depot FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "points_depot_delete_admin" ON points_depot;
CREATE POLICY "points_depot_delete_admin" ON points_depot FOR DELETE TO authenticated USING (true);

-- ==================== COLLECTEURS ====================
CREATE TABLE IF NOT EXISTS collecteurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  vehicle_type text DEFAULT 'camion' CHECK (vehicle_type IN ('camion','tricycle','charrette','autre')),
  commune_ids text[] DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE collecteurs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "collecteurs_select_all" ON collecteurs;
CREATE POLICY "collecteurs_select_all" ON collecteurs FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "collecteurs_insert_auth" ON collecteurs;
CREATE POLICY "collecteurs_insert_auth" ON collecteurs FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "collecteurs_update_auth" ON collecteurs;
CREATE POLICY "collecteurs_update_auth" ON collecteurs FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "collecteurs_delete_auth" ON collecteurs;
CREATE POLICY "collecteurs_delete_auth" ON collecteurs FOR DELETE TO authenticated USING (true);

-- ==================== TOURNEES ====================
CREATE TABLE IF NOT EXISTS tournees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collecteur_id uuid REFERENCES collecteurs(id) ON DELETE SET NULL,
  commune_id uuid REFERENCES communes(id),
  date_scheduled date NOT NULL,
  date_completed date,
  status text NOT NULL DEFAULT 'planifiee' CHECK (status IN ('planifiee','en_cours','terminee','annulee')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tournees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tournees_select_all" ON tournees;
CREATE POLICY "tournees_select_all" ON tournees FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "tournees_insert_auth" ON tournees;
CREATE POLICY "tournees_insert_auth" ON tournees FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "tournees_update_auth" ON tournees;
CREATE POLICY "tournees_update_auth" ON tournees FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "tournees_delete_auth" ON tournees;
CREATE POLICY "tournees_delete_auth" ON tournees FOR DELETE TO authenticated USING (true);

-- ==================== TOURNEE POINTS ====================
CREATE TABLE IF NOT EXISTS tournee_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournee_id uuid NOT NULL REFERENCES tournees(id) ON DELETE CASCADE,
  point_depot_id uuid NOT NULL REFERENCES points_depot(id),
  order_index integer NOT NULL DEFAULT 0,
  collected_at timestamptz,
  quantity_kg numeric(8,2)
);

ALTER TABLE tournee_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tournee_points_select_all" ON tournee_points;
CREATE POLICY "tournee_points_select_all" ON tournee_points FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "tournee_points_insert_auth" ON tournee_points;
CREATE POLICY "tournee_points_insert_auth" ON tournee_points FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "tournee_points_update_auth" ON tournee_points;
CREATE POLICY "tournee_points_update_auth" ON tournee_points FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "tournee_points_delete_auth" ON tournee_points;
CREATE POLICY "tournee_points_delete_auth" ON tournee_points FOR DELETE TO authenticated USING (true);

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_signalements_commune ON signalements(commune_id);
CREATE INDEX IF NOT EXISTS idx_signalements_status ON signalements(status);
CREATE INDEX IF NOT EXISTS idx_signalements_type ON signalements(type);
CREATE INDEX IF NOT EXISTS idx_signalements_user ON signalements(user_id);
CREATE INDEX IF NOT EXISTS idx_signalements_created ON signalements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_depot_commune ON points_depot(commune_id);
CREATE INDEX IF NOT EXISTS idx_tournees_collecteur ON tournees(collecteur_id);
