INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('vendor-images', 'vendor-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read vendor images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'vendor-images');

CREATE POLICY "Service role can manage vendor images"
  ON storage.objects FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'vendor-images');

CREATE POLICY "Service role can update vendor images"
  ON storage.objects FOR UPDATE TO service_role
  USING (bucket_id = 'vendor-images');

CREATE POLICY "Service role can delete vendor images"
  ON storage.objects FOR DELETE TO service_role
  USING (bucket_id = 'vendor-images');
