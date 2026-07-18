
/*
# KinshasaEco — Secure points increment RPC (Migration 009)

## Problem
The frontend tried to increment profiles.points directly via UPDATE, which
is now blocked by the protect_profile_columns trigger (only admins can
change points). This means citizens never earn points for signalements.

## Fix
Create a SECURITY DEFINER function `award_points(amount int)` that:
- Adds `amount` to the caller's points (positive or zero only)
- Updates the level based on the new point total
- Returns the new point total
- Is callable by any authenticated user but only affects THEIR OWN row

This is the correct pattern: privilege escalation prevention (trigger)
plus a controlled server-side function for the legitimate use case.
*/

CREATE OR REPLACE FUNCTION public.award_points(amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_points integer;
  new_level text;
BEGIN
  IF amount < 0 THEN
    RAISE EXCEPTION 'amount must be non-negative';
  END IF;

  UPDATE public.profiles
  SET points = points + amount,
      level = CASE
        WHEN points + amount >= 1500 THEN 'ambassadeur'
        WHEN points + amount >= 500 THEN 'militant'
        WHEN points + amount >= 100 THEN 'actif'
        ELSE 'debutant'
      END,
      updated_at = now()
  WHERE id = auth.uid()
  RETURNING points INTO new_points;

  RETURN new_points;
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_points(integer) TO authenticated;
