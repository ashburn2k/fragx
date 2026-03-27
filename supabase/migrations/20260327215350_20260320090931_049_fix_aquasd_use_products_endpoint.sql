UPDATE vendor_scrape_configs SET use_products_endpoint = true WHERE slug = 'aquasd';
UPDATE vendor_scrape_runs SET status = 'failed', error_message = 'Stuck — cleaned up by migration 049'
WHERE vendor_slug = 'aquasd' AND status = 'running';
