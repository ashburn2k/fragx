DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'have_list' AND column_name = 'image_url') THEN
    ALTER TABLE have_list ADD COLUMN image_url text DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'want_list' AND column_name = 'image_url') THEN
    ALTER TABLE want_list ADD COLUMN image_url text DEFAULT NULL;
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('trade-images', 'trade-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload trade images') THEN
    CREATE POLICY "Authenticated users can upload trade images"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'trade-images' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read access for trade images') THEN
    CREATE POLICY "Public read access for trade images"
      ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'trade-images');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete own trade images') THEN
    CREATE POLICY "Users can delete own trade images"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'trade-images' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;
