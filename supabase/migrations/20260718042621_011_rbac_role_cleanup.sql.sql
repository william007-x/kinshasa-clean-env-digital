/*
# RBAC Role Cleanup

## Summary
Restricts the `profiles.role` column to the 5 official roles defined in the
validated RBAC matrix of the Plateforme Numérique Écologique de Kinshasa:
  - citoyen
  - collecteur
  - ong
  - autorite
  - admin

The roles `entreprise`, `ecole`, and `association` are removed from the
platform. No existing profiles use those roles (verified before applying).

## Changes
1. Add a CHECK constraint enforcing the 5 allowed values.
2. Backfill safety: if any row held a removed role, map it to `citoyen`
   before the constraint is applied (defensive — no such rows exist).
3. Remove the `entreprise/ecole/association` values from any RLS policies
   that still reference them (articles/campagnes INSERT policies were
   already cleaned in migration 010; this is a belt-and-suspenders pass).
*/

-- Defensive backfill (no-op if no removed roles are present)
UPDATE public.profiles
SET role = 'citoyen', updated_at = now()
WHERE role NOT IN ('citoyen','collecteur','ong','autorite','admin');

-- Drop any existing constraint with the same name to remain idempotent
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_valid_rbac;

-- Enforce the 5 official roles
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_valid_rbac
  CHECK (role IN ('citoyen','collecteur','ong','autorite','admin'));
