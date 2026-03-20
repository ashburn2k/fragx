/*
  # Create vendor-images Storage Bucket

  Creates a public Supabase Storage bucket to cache vendor product images
  locally so images remain available even if vendors remove products from
  their Shopify stores.

  ## Changes
  - Creates `vendor-images` bucket (public read access)
  - Adds SELECT policy so anyone can read images
  - Adds INSERT/UPDATE/DELETE policies restricted to service_role only
    (scrapers use the service role key)

  ## Notes
  - Images are stored at path: `{vendor_slug}/{shopify_id}` for vendor products
  - WWC images stored at: `wwc/{shopify_id}`
  - Bucket is public so frontend can display images without auth
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-images',
  'vendor-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read vendor images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'vendor-images');

CREATE POLICY "Service role can manage vendor images"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'vendor-images');

CREATE POLICY "Service role can update vendor images"
  ON storage.objects FOR UPDATE
  TO service_role
  USING (bucket_id = 'vendor-images');

CREATE POLICY "Service role can delete vendor images"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'vendor-images');
