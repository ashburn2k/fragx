SELECT cron.unschedule('weekly-vendor-price-scrape')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-vendor-price-scrape');

SELECT cron.unschedule('daily-vendor-price-scrape')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-vendor-price-scrape');

SELECT cron.schedule('daily-vendor-price-scrape', '0 2 * * *', $$ SELECT trigger_weekly_vendor_scrape(); $$);
