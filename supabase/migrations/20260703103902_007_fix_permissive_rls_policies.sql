
/*
# KinshasaEco — Fix 19 permissive RLS policies (Migration 007)

## Problem
19 policies across migrations 001-003 used WITH CHECK (true) or USING (true),
allowing ANY authenticated user to insert/update/delete rows that should be
restricted to admins, autorites, or collecteurs. This is a privilege escalation:
a regular citoyen could create communes, delete points_depot, insert tournees,
self-assign badges, or forge notifications.

## Fix — 19 policies replaced with proper role checks

A security helper function `is_admin()` is created to keep policies readable
and avoid repeating the same EXISTS subquery everywhere.

### communes (3 policies)
1. communes_insert_auth  → admin only
2. communes_update_auth  → admin only
3. communes_delete_auth  → admin only

### points_depot (3 policies)
4. points_depot_insert   → admin/autorite only
5. points_depot_update   → admin/autorite/collecteur only
6. points_depot_delete   → admin only

### collecteurs (3 policies)
7. collecteurs_insert    → admin/autorite only
8. collecteurs_update    → admin/autorite only
9. collecteurs_delete    → admin only

### tournees (3 policies)
10. tournees_insert      → admin/autorite/collecteur only
11. tournees_update      → admin/autorite/collecteur only
12. tournees_delete      → admin only

### tournee_points (3 policies)
13. tournee_points_insert → admin/autorite/collecteur only
14. tournee_points_update → admin/autorite/collecteur only
15. tournee_points_delete → admin only

### articles (1 policy)
16. articles_insert      → restrict to admin/ong/ecole/association/autorite roles

### campagnes (1 policy)
17. campagnes_insert     → restrict to admin/ong/ecole/association/autorite roles

### audit_logs (1 policy)
18. audit_logs_insert    → restrict to authenticated (was WITH CHECK true, now
     requires the row's user_id to match the caller so users can't forge logs
     under another user's identity)

### notifications (1 policy)
19. notifications_insert → admin only (remove self-insert path that let users
     forge notifications appearing in their own inbox)

## Additional hardening
- profiles UPDATE policy tightened: users can still update their own row BUT
  the `role`, `points`, and `level` columns are now protected via a trigger
  that rejects privilege-escalation attempts (a citoyen trying to set
  role='admin' or points=99999).
*/

-- ==================== HELPER FUNCTIONS ====================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(required_roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = ANY(required_roles)
  );
$$;

-- ==================== COMMUNES (3 fixes) ====================
DROP POLICY IF EXISTS "communes_insert_auth" ON communes;
CREATE POLICY "communes_insert_auth" ON communes FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "communes_update_auth" ON communes;
CREATE POLICY "communes_update_auth" ON communes FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "communes_delete_auth" ON communes;
CREATE POLICY "communes_delete_auth" ON communes FOR DELETE
  TO authenticated USING (public.is_admin());

-- ==================== POINTS DEPOT (3 fixes) ====================
DROP POLICY IF EXISTS "points_depot_insert_admin" ON points_depot;
CREATE POLICY "points_depot_insert_admin" ON points_depot FOR INSERT
  TO authenticated WITH CHECK (public.has_role(ARRAY['admin','autorite']));

DROP POLICY IF EXISTS "points_depot_update_admin" ON points_depot;
CREATE POLICY "points_depot_update_admin" ON points_depot FOR UPDATE
  TO authenticated
  USING (public.has_role(ARRAY['admin','autorite','collecteur']))
  WITH CHECK (public.has_role(ARRAY['admin','autorite','collecteur']));

DROP POLICY IF EXISTS "points_depot_delete_admin" ON points_depot;
CREATE POLICY "points_depot_delete_admin" ON points_depot FOR DELETE
  TO authenticated USING (public.is_admin());

-- ==================== COLLECTEURS (3 fixes) ====================
DROP POLICY IF EXISTS "collecteurs_insert_auth" ON collecteurs;
CREATE POLICY "collecteurs_insert_auth" ON collecteurs FOR INSERT
  TO authenticated WITH CHECK (public.has_role(ARRAY['admin','autorite']));

DROP POLICY IF EXISTS "collecteurs_update_auth" ON collecteurs;
CREATE POLICY "collecteurs_update_auth" ON collecteurs FOR UPDATE
  TO authenticated
  USING (public.has_role(ARRAY['admin','autorite']))
  WITH CHECK (public.has_role(ARRAY['admin','autorite']));

DROP POLICY IF EXISTS "collecteurs_delete_auth" ON collecteurs;
CREATE POLICY "collecteurs_delete_auth" ON collecteurs FOR DELETE
  TO authenticated USING (public.is_admin());

-- ==================== TOURNEES (3 fixes) ====================
DROP POLICY IF EXISTS "tournees_insert_auth" ON tournees;
CREATE POLICY "tournees_insert_auth" ON tournees FOR INSERT
  TO authenticated WITH CHECK (public.has_role(ARRAY['admin','autorite','collecteur']));

DROP POLICY IF EXISTS "tournees_update_auth" ON tournees;
CREATE POLICY "tournees_update_auth" ON tournees FOR UPDATE
  TO authenticated
  USING (public.has_role(ARRAY['admin','autorite','collecteur']))
  WITH CHECK (public.has_role(ARRAY['admin','autorite','collecteur']));

DROP POLICY IF EXISTS "tournees_delete_auth" ON tournees;
CREATE POLICY "tournees_delete_auth" ON tournees FOR DELETE
  TO authenticated USING (public.is_admin());

-- ==================== TOURNEE POINTS (3 fixes) ====================
DROP POLICY IF EXISTS "tournee_points_insert_auth" ON tournee_points;
CREATE POLICY "tournee_points_insert_auth" ON tournee_points FOR INSERT
  TO authenticated WITH CHECK (public.has_role(ARRAY['admin','autorite','collecteur']));

DROP POLICY IF EXISTS "tournee_points_update_auth" ON tournee_points;
CREATE POLICY "tournee_points_update_auth" ON tournee_points FOR UPDATE
  TO authenticated
  USING (public.has_role(ARRAY['admin','autorite','collecteur']))
  WITH CHECK (public.has_role(ARRAY['admin','autorite','collecteur']));

DROP POLICY IF EXISTS "tournee_points_delete_auth" ON tournee_points;
CREATE POLICY "tournee_points_delete_auth" ON tournee_points FOR DELETE
  TO authenticated USING (public.is_admin());

-- ==================== ARTICLES (1 fix) ====================
-- Was: any authenticated user with auth.uid() = author_id
-- Now: only institutional roles can publish articles
DROP POLICY IF EXISTS "articles_insert_auth" ON articles;
CREATE POLICY "articles_insert_auth" ON articles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND
    public.has_role(ARRAY['admin','ong','ecole','association','autorite'])
  );

-- ==================== CAMPAGNES (1 fix) ====================
-- Was: any authenticated user with auth.uid() = organizer_id
-- Now: only institutional roles can create campaigns
DROP POLICY IF EXISTS "campagnes_insert_auth" ON campagnes;
CREATE POLICY "campagnes_insert_auth" ON campagnes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = organizer_id AND
    public.has_role(ARRAY['admin','ong','ecole','association','autorite'])
  );

-- ==================== AUDIT LOGS (1 fix) ====================
-- Was: WITH CHECK (true) — anyone could insert logs under any user_id
-- Now: user_id must match the caller (or be NULL for system events)
DROP POLICY IF EXISTS "audit_logs_insert_auth" ON audit_logs;
CREATE POLICY "audit_logs_insert_auth" ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- ==================== NOTIFICATIONS (1 fix) ====================
-- Was: admin OR auth.uid() = user_id (users could forge notifications in
--   their own inbox, e.g. fake "badge earned" messages)
-- Now: admin only
DROP POLICY IF EXISTS "notifications_insert_admin" ON notifications;
CREATE POLICY "notifications_insert_admin" ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- ==================== PROFILES HARDENING ====================
-- The update policy allowed users to change ANY column on their own row,
-- including `role` (privilege escalation to admin) and `points` (cheating
-- the gamification). A BEFORE UPDATE trigger now blocks changes to
-- protected columns; the RLS policy stays permissive for legitimate
-- profile edits (name, bio, phone, avatar).

CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only admins can change role, points, or level
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    NEW.role := OLD.role;
  END IF;
  IF NEW.points IS DISTINCT FROM OLD.points AND NOT public.is_admin() THEN
    NEW.points := OLD.points;
  END IF;
  IF NEW.level IS DISTINCT FROM OLD.level AND NOT public.is_admin() THEN
    NEW.level := OLD.level;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_columns ON profiles;
CREATE TRIGGER trg_protect_profile_columns
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();
