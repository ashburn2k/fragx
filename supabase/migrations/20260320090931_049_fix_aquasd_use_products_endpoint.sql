/*
  # Fix AquaSD scraping timeout by switching to products endpoint

  ## Problem
  AquaSD has 17 coral collections configured. The collection-by-collection scraping
  approach exceeds the Edge Function execution time limit, causing every scrape run
  to fail with a timeout error and leave 0 products in the database.

  ## Fix
  Switch AquaSD to use the /products.json endpoint instead of per-collection scraping.
  The products.json endpoint is verified to work on aquasd.com and returns all products
  in a single paginated call — much faster and within time limits.

  Also clean up the stuck "running" scrape run records left over from timed-out runs.
*/

UPDATE vendor_scrape_configs
SET use_products_endpoint = true
WHERE slug = 'aquasd';

UPDATE vendor_scrape_runs
SET status = 'failed', error_message = 'Stuck — cleaned up by migration 049'
WHERE vendor_slug = 'aquasd' AND status = 'running';
