
/*
# KinshasaEco — Auto-create profile on signup (Migration 006)

1. Function
   - handle_new_user(): inserts a row into profiles using the new user's id
     and metadata (full_name, role, commune_id) from the auth.users record.

2. Trigger
   - Fires AFTER INSERT on auth.users, calling handle_new_user() for each new row.
   - SECURITY DEFINER so it can write to profiles even though the caller is anon.
   - Idempotent: uses ON CONFLICT (id) DO NOTHING so re-running or duplicate
     signup attempts don't error.

3. Notes
   - The frontend also creates a profile row on signup, but this trigger is the
     safety net for any signup path (OAuth later, edge function, etc.).
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, commune_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'citoyen'),
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
