/*
  # Grant read access to vendor_genus_prices view

  The vendor_genus_prices view aggregates pricing data from vendor_products
  for use in the Price Tracker. It needs to be readable by authenticated and
  anonymous users since it contains only aggregated, non-sensitive market data.
*/

GRANT SELECT ON vendor_genus_prices TO anon, authenticated;
