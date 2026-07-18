
/*
# KinshasaEco — Education, Gamification, Notifications, Audit (Migration 003)

1. New Tables
   - articles: Educational articles and news
   - campagnes: Awareness campaigns
   - badges: Badge definitions
   - user_badges: Badge assignments to users
   - notifications: In-app notifications
   - audit_logs: System audit trail

2. Security
   - articles: published articles are public; admin/author write
   - campagnes: public read; admin/organizer write
   - badges: public read; admin write
   - user_badges: public read; admin write
   - notifications: owner-scoped
   - audit_logs: admin read only
*/

-- ==================== ARTICLES ====================
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  excerpt text,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('general','dechets','eau','erosion','biodiversite','sante','energie','actualite')),
  image_url text,
  tags text[] DEFAULT '{}',
  published boolean NOT NULL DEFAULT false,
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "articles_select_published" ON articles;
CREATE POLICY "articles_select_published" ON articles FOR SELECT TO anon, authenticated
  USING (published = true OR (auth.uid() = author_id) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "articles_insert_auth" ON articles;
CREATE POLICY "articles_insert_auth" ON articles FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "articles_update_own_or_admin" ON articles;
CREATE POLICY "articles_update_own_or_admin" ON articles FOR UPDATE TO authenticated
  USING (auth.uid() = author_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "articles_delete_own_or_admin" ON articles;
CREATE POLICY "articles_delete_own_or_admin" ON articles FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ==================== CAMPAGNES ====================
CREATE TABLE IF NOT EXISTS campagnes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  target_commune_id uuid REFERENCES communes(id),
  goal text,
  participants_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'a_venir' CHECK (status IN ('a_venir','active','terminee','annulee')),
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE campagnes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "campagnes_select_all" ON campagnes;
CREATE POLICY "campagnes_select_all" ON campagnes FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "campagnes_insert_auth" ON campagnes;
CREATE POLICY "campagnes_insert_auth" ON campagnes FOR INSERT TO authenticated WITH CHECK (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "campagnes_update_own_or_admin" ON campagnes;
CREATE POLICY "campagnes_update_own_or_admin" ON campagnes FOR UPDATE TO authenticated
  USING (auth.uid() = organizer_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "campagnes_delete_admin" ON campagnes;
CREATE POLICY "campagnes_delete_admin" ON campagnes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ==================== BADGES ====================
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'award',
  criteria_type text NOT NULL CHECK (criteria_type IN ('signalements','points','campagnes','articles','votes')),
  criteria_value integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "badges_select_all" ON badges;
CREATE POLICY "badges_select_all" ON badges FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "badges_insert_admin" ON badges;
CREATE POLICY "badges_insert_admin" ON badges FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "badges_update_admin" ON badges;
CREATE POLICY "badges_update_admin" ON badges FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "badges_delete_admin" ON badges;
CREATE POLICY "badges_delete_admin" ON badges FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ==================== USER BADGES ====================
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_badges_select_all" ON user_badges;
CREATE POLICY "user_badges_select_all" ON user_badges FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "user_badges_insert_admin" ON user_badges;
CREATE POLICY "user_badges_insert_admin" ON user_badges FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "user_badges_delete_admin" ON user_badges;
CREATE POLICY "user_badges_delete_admin" ON user_badges FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ==================== NOTIFICATIONS ====================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info','success','warning','error','signalement','badge')),
  read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_admin" ON notifications;
CREATE POLICY "notifications_insert_admin" ON notifications FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') OR auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ==================== AUDIT LOGS ====================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select_admin" ON audit_logs;
CREATE POLICY "audit_logs_select_admin" ON audit_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "audit_logs_insert_auth" ON audit_logs;
CREATE POLICY "audit_logs_insert_auth" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
