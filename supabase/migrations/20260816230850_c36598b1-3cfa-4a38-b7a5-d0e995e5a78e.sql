DROP POLICY IF EXISTS "admins read originals" ON storage.objects;
CREATE POLICY "admins read originals" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'originals' AND public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "admins insert originals" ON storage.objects;
CREATE POLICY "admins insert originals" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'originals' AND public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "admins update originals" ON storage.objects;
CREATE POLICY "admins update originals" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'originals' AND public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'originals' AND public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "admins delete originals" ON storage.objects;
CREATE POLICY "admins delete originals" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'originals' AND public.has_role(auth.uid(), 'admin'::public.app_role));