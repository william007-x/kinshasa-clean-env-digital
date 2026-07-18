
/*
# KinshasaEco — Storage policies for signalements bucket (Migration 005)

1. Storage
   - 'signalements' bucket is public (created separately).
   - Add storage policies so authenticated users can upload their own photos,
     and anyone can read (bucket is public, but explicit policies are best practice).

2. Security
   - SELECT (read): public — anyone can view signalement photos.
   - INSERT (upload): authenticated users only.
   - UPDATE/DELETE: owner or admin.
*/

DROP POLICY IF EXISTS "signalements_read_all" ON storage.objects;
CREATE POLICY "signalements_read_all" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'signalements');

DROP POLICY IF EXISTS "signalements_insert_auth" ON storage.objects;
CREATE POLICY "signalements_insert_auth" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'signalements');

DROP POLICY IF EXISTS "signalements_update_own" ON storage.objects;
CREATE POLICY "signalements_update_own" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'signalements' AND owner = auth.uid());

DROP POLICY IF EXISTS "signalements_delete_own_or_admin" ON storage.objects;
CREATE POLICY "signalements_delete_own_or_admin" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'signalements' AND (owner = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')));
