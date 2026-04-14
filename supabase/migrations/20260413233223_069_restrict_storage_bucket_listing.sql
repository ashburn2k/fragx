/*
  # Restrict Public Storage Bucket Listing

  ## Summary
  Removes broad SELECT policies from public storage buckets that allowed any
  client to list all files in the bucket. Public buckets do not require SELECT
  RLS policies for URL-based object access — the public URL works without them.

  Removing these policies prevents clients from enumerating all stored files
  while keeping individual object URLs fully accessible.

  ## Changes

  - Drop "Public read access for trade images" SELECT policy from storage.objects
    (bucket: trade-images)
  - Drop "Public can read vendor images" SELECT policy from storage.objects
    (bucket: vendor-images)

  ## Notes
  - Object URLs (getPublicUrl) continue to work — public buckets bypass RLS for URL access
  - DELETE policy for trade-images is preserved (users can still delete their own images)
  - INSERT/UPDATE/DELETE policies for vendor-images are preserved
*/

DROP POLICY IF EXISTS "Public read access for trade images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read vendor images" ON storage.objects;
