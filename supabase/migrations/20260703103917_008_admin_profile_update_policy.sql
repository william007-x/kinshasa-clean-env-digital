
/*
# KinshasaEco — Allow admin to update any profile (Migration 008)

## Problem
The profiles UPDATE policy only allows auth.uid() = id (self-update).
An admin changing another user's role via the admin panel is blocked by RLS.

## Fix
Replace the single self-update policy with a policy that allows:
- self-update (auth.uid() = id), OR
- admin update (is_admin())

The protect_profile_columns trigger already prevents non-admins from
changing role/points/level, so this is safe.
*/

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own_or_admin" ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());
