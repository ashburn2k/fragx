/*
  # Change Vendor Price Scrape from Weekly to Daily

  Summary:
  Updates the pg_cron schedule for vendor price scraping from once per week
  (every Monday at 02:00 UTC) to once per day (every day at 02:00 UTC).

  Changes:
  1. Unschedules the existing 'weekly-vendor-price-scrape' job if it exists
  2. Creates a new daily cron job named 'daily-vendor-price-scrape' that runs
     every day at 02:00 UTC, calling the same trigger_weekly_vendor_scrape()
     function (which iterates over all active vendors)
*/

SELECT cron.unschedule('weekly-vendor-price-scrape')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'weekly-vendor-price-scrape'
);

SELECT cron.unschedule('daily-vendor-price-scrape')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-vendor-price-scrape'
);

SELECT cron.schedule(
  'daily-vendor-price-scrape',
  '0 2 * * *',
  $$ SELECT trigger_weekly_vendor_scrape(); $$
);
