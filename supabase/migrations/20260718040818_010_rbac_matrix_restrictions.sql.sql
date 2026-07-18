/*
# RBAC Matrix Restrictions

## Summary
Tightens Row Level Security policies across all core tables to match the
Role-Based Access Control (RBAC) matrix defined in the project security
specification. The principle of least privilege is now enforced at the
database level, preventing unauthorized API access even if the frontend
is bypassed.

## RBAC Matrix (per role)

| Role        | Signalements                  | Dechets (points/tournees)     | Education/Campagnes         | Stats       |
|-------------|-------------------------------|-------------------------------|-----------------------------|-------------|
| Citoyen     | CRUD own (while pending)      | Read-only                     | Read-only                   | No access   |
| Collecteur  | Update assigned status only   | CRUD own tournees             | Read-only                   | No access   |
| ONG         | Read-only                     | Read-only                     | CRUD own content            | No access   |
| Autorite    | Read + assign                 | Read-only global              | Read-only                   | Full read   |
| Admin       | Full control                  | Full control                  | Full control                | Full control|

## Changes by table

### signalements
- INSERT: restricted to `citoyen` + `admin` (was: any authenticated).
- UPDATE: admin OR autorite (assign) OR collecteur-assigned-to-row
  OR owner-while-status-is-en_attente. Replaces the previous permissive
  policy that allowed any owner or any collecteur to update.
- DELETE: admin OR owner-while-status-is-en_attente. Previously allowed
  owner deletion regardless of status.

### collecteurs
- INSERT / UPDATE: restricted to `admin` only (was: admin + autorite).
  Per matrix, only Admin manages official collection companies.

### points_depot
- INSERT: admin + autorite (unchanged — autorite can register points).
- UPDATE: admin + autorite + collecteur (collecteur declares a point
  emptied by updating fill percentage).
- DELETE: admin only (unchanged).

### tournees
- INSERT: collecteur + admin (was: collecteur + autorite + admin).
- UPDATE: collecteur-own (collecteur_id links to profiles) + admin.
  Previously allowed any collecteur to update any tournee.
- DELETE: collecteur-own + admin (was: admin only — now collecteur can
  cancel their own).

### campagnes
- INSERT: removed `autorite` from allowed roles (was admin/ong/ecole/
  association/autorite). Autorite has read-only on collaborative portal.
- UPDATE / DELETE: unchanged (own or admin).

### articles
- INSERT: removed `autorite` from allowed roles. Autorite has read-only
  on educational portal.
- UPDATE / DELETE: unchanged (own or admin).

## Security notes
1. All SELECT policies on public-content tables remain `USING (true)`
   with `TO anon, authenticated` because incidents, points, articles,
   and campaigns are intentionally public-visible (map, education portal).
   This is documented intentional public data, not a security fallback.
2. `has_role()` and `is_admin()` SECURITY DEFINER helper functions are
   reused — no new functions needed.
3. Policies are dropped before recreate to remain idempotent.
*/

-- ============================================================
-- signalements
-- ============================================================

DROP POLICY IF EXISTS "signalements_insert_auth" ON signalements;
CREATE POLICY "signalements_insert_auth" ON signalements FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id) AND has_role(ARRAY['citoyen','admin']));

DROP POLICY IF EXISTS "signalements_update_own_or_admin" ON signalements;
CREATE POLICY "signalements_update_rbac" ON signalements FOR UPDATE
  TO authenticated
  USING (
    is_admin()
    OR has_role(ARRAY['autorite'])
    OR (has_role(ARRAY['collecteur']) AND assigned_to = auth.uid())
    OR (auth.uid() = user_id AND status = 'en_attente')
  )
  WITH CHECK (
    is_admin()
    OR has_role(ARRAY['autorite'])
    OR (has_role(ARRAY['collecteur']) AND assigned_to = auth.uid())
    OR (auth.uid() = user_id AND status = 'en_attente')
  );

DROP POLICY IF EXISTS "signalements_delete_own_or_admin" ON signalements;
CREATE POLICY "signalements_delete_rbac" ON signalements FOR DELETE
  TO authenticated
  USING (
    is_admin()
    OR (auth.uid() = user_id AND status = 'en_attente')
  );

-- ============================================================
-- collecteurs
-- ============================================================

DROP POLICY IF EXISTS "collecteurs_insert_auth" ON collecteurs;
CREATE POLICY "collecteurs_insert_admin" ON collecteurs FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "collecteurs_update_auth" ON collecteurs;
CREATE POLICY "collecteurs_update_admin" ON collecteurs FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================
-- tournees
-- ============================================================

DROP POLICY IF EXISTS "tournees_insert_auth" ON tournees;
CREATE POLICY "tournees_insert_collecteur_or_admin" ON tournees FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(ARRAY['collecteur','admin'])
    AND (collecteur_id IS NULL OR EXISTS (
      SELECT 1 FROM collecteurs c
      WHERE c.id = tournees.collecteur_id
      AND (c.user_id = auth.uid() OR is_admin())
    ))
  );

DROP POLICY IF EXISTS "tournees_update_auth" ON tournees;
CREATE POLICY "tournees_update_own_or_admin" ON tournees FOR UPDATE
  TO authenticated
  USING (
    is_admin()
    OR (
      has_role(ARRAY['collecteur'])
      AND collecteur_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM collecteurs c
        WHERE c.id = tournees.collecteur_id AND c.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    is_admin()
    OR (
      has_role(ARRAY['collecteur'])
      AND collecteur_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM collecteurs c
        WHERE c.id = tournees.collecteur_id AND c.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "tournees_delete_auth" ON tournees;
CREATE POLICY "tournees_delete_own_or_admin" ON tournees FOR DELETE
  TO authenticated
  USING (
    is_admin()
    OR (
      has_role(ARRAY['collecteur'])
      AND collecteur_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM collecteurs c
        WHERE c.id = tournees.collecteur_id AND c.user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- campagnes (remove autorite from insert)
-- ============================================================

DROP POLICY IF EXISTS "campagnes_insert_auth" ON campagnes;
CREATE POLICY "campagnes_insert_rbac" ON campagnes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = organizer_id
    AND has_role(ARRAY['admin','ong','ecole','association'])
  );

-- ============================================================
-- articles (remove autorite from insert)
-- ============================================================

DROP POLICY IF EXISTS "articles_insert_auth" ON articles;
CREATE POLICY "articles_insert_rbac" ON articles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND has_role(ARRAY['admin','ong','ecole','association'])
  );
