import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  product_type: string;
  tags: string[];
  body_html: string;
  images: { src: string }[];
  variants: { price: string; compare_at_price: string | null; available: boolean }[];
}

interface VenderUpItem {
  name: string;
  category: string | null;
  link: string;
  price: string;
  trackInventory: boolean;
  availableInventory: number;
  thumbSource: string;
  siteSequenceNumber: number;
  categorySequenceNumber: number | null;
}

interface VenderUpResponse {
  categories: { name: string; description: string; sequenceNumber: number }[];
  items: VenderUpItem[];
}

interface VendorConfig {
  slug: string;
  name: string;
  base_url: string;
  coral_collections: string[];
  fish_collections: string[];
  use_products_endpoint?: boolean;
  platform?: string;
  venderup_site_link?: string;
}

interface ExistingProduct {
  shopify_id: number;
  price: number;
  handle: string;
  title: string;
}

function hashStringToBigint(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash & 0x7fffffff;
  }
  return Math.abs(hash);
}

async function fetchPage(url: string): Promise<ShopifyProduct[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; coral-price-tracker/1.0)" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products ?? [];
  } catch {
    return [];
  }
}

async function fetchAllPages(baseUrl: string, path: string): Promise<ShopifyProduct[]> {
  const all: ShopifyProduct[] = [];
  let page = 1;
  while (true) {
    const url = `${baseUrl}${path}?limit=250&page=${page}`;
    const products = await fetchPage(url);
    if (products.length === 0) break;
    all.push(...products);
    if (products.length < 250) break;
    page++;
    await new Promise(r => setTimeout(r, 300));
  }
  return all;
}

function buildShopifyRecord(
  product: ShopifyProduct,
  vendorSlug: string,
  collection: string
): object | null {
  const variant = product.variants?.[0];
  if (!variant) return null;
  const price = parseFloat(variant.price);
  if (isNaN(price) || price <= 0) return null;
  const isAvailable = product.variants.some(v => v.available === true);
  return {
    vendor_slug: vendorSlug,
    shopify_id: product.id,
    handle: product.handle,
    title: product.title,
    product_type: product.product_type ?? "",
    collection,
    price,
    compare_at_price: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
    image_url: product.images?.[0]?.src ?? null,
    tags: Array.isArray(product.tags) ? product.tags : [],
    description: product.body_html
      ? product.body_html.replace(/<[^>]*>/g, "").trim().slice(0, 1000)
      : null,
    scraped_at: new Date().toISOString(),
    is_available: isAvailable,
  };
}

function buildVenderUpRecord(
  item: VenderUpItem,
  vendorSlug: string
): object | null {
  const price = parseFloat(item.price);
  if (isNaN(price) || price <= 0) return null;

  const thumbSrc = item.thumbSource && item.thumbSource !== "null" ? item.thumbSource : null;
  const isAvailable = !item.trackInventory || item.availableInventory > 0;
  const collection = item.category?.toLowerCase().replace(/\s+/g, "-") || "general";

  return {
    vendor_slug: vendorSlug,
    shopify_id: hashStringToBigint(item.link),
    handle: item.link,
    title: item.name,
    product_type: item.category ?? "",
    collection,
    price,
    compare_at_price: null,
    image_url: thumbSrc,
    tags: item.category ? [item.category.toLowerCase()] : [],
    description: null,
    scraped_at: new Date().toISOString(),
    is_available: isAvailable,
  };
}

async function scrapeVenderUpVendor(
  vendor: VendorConfig,
  supabase: ReturnType<typeof createClient>
): Promise<{ found: number; priceChanges: number; errors: number }> {
  const siteLink = vendor.venderup_site_link;
  if (!siteLink) {
    console.error(`No venderup_site_link for vendor ${vendor.slug}`);
    return { found: 0, priceChanges: 0, errors: 1 };
  }

  const { data: existingRaw } = await supabase
    .from("vendor_products")
    .select("shopify_id, price, handle, title")
    .eq("vendor_slug", vendor.slug);

  const existingMap = new Map<number, ExistingProduct>();
  for (const p of (existingRaw ?? [])) {
    existingMap.set(p.shopify_id, p);
  }

  let venderupData: VenderUpResponse | null = null;
  try {
    const res = await fetch(`https://api.venderup.me/api/v1/sites/${siteLink}/items`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; coral-price-tracker/1.0)" },
      signal: AbortSignal.timeout(30000),
    });
    if (res.ok) {
      venderupData = await res.json();
    }
  } catch (e) {
    console.error(`VenderUp fetch error for ${vendor.slug}:`, e);
    return { found: 0, priceChanges: 0, errors: 1 };
  }

  if (!venderupData) return { found: 0, priceChanges: 0, errors: 1 };

  const allRecords = new Map<number, object>();
  const seenIds = new Set<number>();

  for (const item of venderupData.items) {
    const record = buildVenderUpRecord(item, vendor.slug);
    if (!record) continue;
    const rec = record as { shopify_id: number };
    if (!seenIds.has(rec.shopify_id)) {
      allRecords.set(rec.shopify_id, record);
      seenIds.add(rec.shopify_id);
    }
  }

  const historyRecords: object[] = [];
  for (const [shopifyId, record] of allRecords) {
    const rec = record as { shopify_id: number; price: number; handle: string; title: string; compare_at_price: number | null };
    const existing = existingMap.get(shopifyId);

    if (!existing) {
      historyRecords.push({
        vendor_slug: vendor.slug,
        shopify_id: rec.shopify_id,
        handle: rec.handle,
        title: rec.title,
        price: rec.price,
        compare_at_price: rec.compare_at_price,
        price_change: null,
        price_change_pct: null,
        recorded_at: new Date().toISOString(),
      });
    } else if (Math.abs(existing.price - rec.price) >= 0.01) {
      const change = rec.price - existing.price;
      const changePct = existing.price > 0
        ? Math.round((change / existing.price) * 10000) / 100
        : null;
      historyRecords.push({
        vendor_slug: vendor.slug,
        shopify_id: rec.shopify_id,
        handle: rec.handle,
        title: rec.title,
        price: rec.price,
        compare_at_price: rec.compare_at_price,
        price_change: Math.round(change * 100) / 100,
        price_change_pct: changePct,
        recorded_at: new Date().toISOString(),
      });
    }
  }

  let totalFound = 0;
  let errors = 0;
  const recordsArr = Array.from(allRecords.values());
  const BATCH = 250;

  for (let i = 0; i < recordsArr.length; i += BATCH) {
    const { error } = await supabase
      .from("vendor_products")
      .upsert(recordsArr.slice(i, i + BATCH), { onConflict: "vendor_slug,shopify_id" });
    if (error) {
      console.error(`Upsert error for ${vendor.slug}:`, error.message);
      errors++;
    } else {
      totalFound += Math.min(BATCH, recordsArr.length - i);
    }
  }

  if (historyRecords.length > 0) {
    const HBATCH = 500;
    for (let i = 0; i < historyRecords.length; i += HBATCH) {
      const { error } = await supabase
        .from("vendor_price_history")
        .insert(historyRecords.slice(i, i + HBATCH));
      if (error) {
        console.error(`History insert error for ${vendor.slug}:`, error.message);
      }
    }
  }

  const unseenIds = Array.from(existingMap.keys()).filter(id => !seenIds.has(id));
  if (unseenIds.length > 0) {
    const UBATCH = 500;
    for (let i = 0; i < unseenIds.length; i += UBATCH) {
      await supabase
        .from("vendor_products")
        .update({ is_available: false, scraped_at: new Date().toISOString() })
        .eq("vendor_slug", vendor.slug)
        .in("shopify_id", unseenIds.slice(i, i + UBATCH));
    }
  }

  await supabase
    .from("vendor_scrape_configs")
    .update({ last_scraped_at: new Date().toISOString() })
    .eq("slug", vendor.slug);

  return { found: totalFound, priceChanges: historyRecords.filter((h: any) => h.price_change !== null).length, errors };
}

async function scrapeShopifyVendor(
  vendor: VendorConfig,
  includefish: boolean,
  supabase: ReturnType<typeof createClient>
): Promise<{ found: number; priceChanges: number; errors: number }> {
  const { data: existingRaw } = await supabase
    .from("vendor_products")
    .select("shopify_id, price, handle, title")
    .eq("vendor_slug", vendor.slug);

  const existingMap = new Map<number, ExistingProduct>();
  for (const p of (existingRaw ?? [])) {
    existingMap.set(p.shopify_id, p);
  }

  const seenIds = new Set<number>();
  const allRecords = new Map<number, object>();
  const historyRecords: object[] = [];

  if (vendor.use_products_endpoint !== false) {
    const products = await fetchAllPages(vendor.base_url, "/products.json");
    for (const product of products) {
      if (seenIds.has(product.id)) continue;
      const collection = product.product_type?.toLowerCase().replace(/\s+/g, "-") || "all";
      const record = buildShopifyRecord(product, vendor.slug, collection);
      if (!record) continue;
      seenIds.add(product.id);
      allRecords.set(product.id, record);
    }
  }

  const collections = [
    ...vendor.coral_collections,
    ...(includefish ? vendor.fish_collections : []),
  ];

  for (const collection of collections) {
    let page = 1;
    while (true) {
      const url = `${vendor.base_url}/collections/${collection}/products.json`;
      const products = await fetchPage(`${url}?limit=250&page=${page}`);
      if (products.length === 0) break;

      for (const product of products) {
        const record = buildShopifyRecord(product, vendor.slug, collection);
        if (!record) continue;
        if (!seenIds.has(product.id)) {
          allRecords.set(product.id, record);
          seenIds.add(product.id);
        }
      }

      if (products.length < 250) break;
      page++;
      await new Promise(r => setTimeout(r, 300));
    }
    await new Promise(r => setTimeout(r, 200));
  }

  for (const [shopifyId, record] of allRecords) {
    const rec = record as { shopify_id: number; price: number; handle: string; title: string; compare_at_price: number | null };
    const existing = existingMap.get(shopifyId);

    if (!existing) {
      historyRecords.push({
        vendor_slug: vendor.slug,
        shopify_id: rec.shopify_id,
        handle: rec.handle,
        title: rec.title,
        price: rec.price,
        compare_at_price: rec.compare_at_price,
        price_change: null,
        price_change_pct: null,
        recorded_at: new Date().toISOString(),
      });
    } else if (Math.abs(existing.price - rec.price) >= 0.01) {
      const change = rec.price - existing.price;
      const changePct = existing.price > 0
        ? Math.round((change / existing.price) * 10000) / 100
        : null;
      historyRecords.push({
        vendor_slug: vendor.slug,
        shopify_id: rec.shopify_id,
        handle: rec.handle,
        title: rec.title,
        price: rec.price,
        compare_at_price: rec.compare_at_price,
        price_change: Math.round(change * 100) / 100,
        price_change_pct: changePct,
        recorded_at: new Date().toISOString(),
      });
    }
  }

  let totalFound = 0;
  let errors = 0;
  const recordsArr = Array.from(allRecords.values());
  const BATCH = 250;

  for (let i = 0; i < recordsArr.length; i += BATCH) {
    const { error } = await supabase
      .from("vendor_products")
      .upsert(recordsArr.slice(i, i + BATCH), { onConflict: "vendor_slug,shopify_id" });
    if (error) {
      console.error(`Upsert error for ${vendor.slug}:`, error.message);
      errors++;
    } else {
      totalFound += Math.min(BATCH, recordsArr.length - i);
    }
  }

  if (historyRecords.length > 0) {
    const HBATCH = 500;
    for (let i = 0; i < historyRecords.length; i += HBATCH) {
      const { error } = await supabase
        .from("vendor_price_history")
        .insert(historyRecords.slice(i, i + HBATCH));
      if (error) {
        console.error(`History insert error for ${vendor.slug}:`, error.message);
      }
    }
  }

  const unseenIds = Array.from(existingMap.keys()).filter(id => !seenIds.has(id));
  if (unseenIds.length > 0) {
    const UBATCH = 500;
    for (let i = 0; i < unseenIds.length; i += UBATCH) {
      await supabase
        .from("vendor_products")
        .update({ is_available: false, scraped_at: new Date().toISOString() })
        .eq("vendor_slug", vendor.slug)
        .in("shopify_id", unseenIds.slice(i, i + UBATCH));
    }
  }

  await supabase
    .from("vendor_scrape_configs")
    .update({ last_scraped_at: new Date().toISOString() })
    .eq("slug", vendor.slug);

  return { found: totalFound, priceChanges: historyRecords.filter((h: any) => h.price_change !== null).length, errors };
}

async function scrapeVendor(
  vendor: VendorConfig,
  includefish: boolean,
  supabase: ReturnType<typeof createClient>
): Promise<{ found: number; priceChanges: number; errors: number }> {
  if (vendor.platform === "venderup") {
    return scrapeVenderUpVendor(vendor, supabase);
  }
  return scrapeShopifyVendor(vendor, includefish, supabase);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const targetSlug: string | undefined = body.vendor_slug;
    const includefish: boolean = body.include_fish ?? false;
    const force: boolean = body.force ?? false;

    const configQuery = supabase
      .from("vendor_scrape_configs")
      .select("*")
      .eq("is_active", true);

    if (targetSlug) {
      configQuery.eq("slug", targetSlug);
    }

    const { data: vendors, error: cfgError } = await configQuery;
    if (cfgError) throw cfgError;
    if (!vendors || vendors.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No active vendor configs found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    const results: Record<string, { found: number; priceChanges: number; errors: number; skipped?: boolean }> = {};

    for (const vendor of vendors as (VendorConfig & { last_scraped_at: string | null })[]) {
      if (!force && vendor.last_scraped_at) {
        const lastMs = new Date(vendor.last_scraped_at).getTime();
        if (now - lastMs < THIRTY_DAYS_MS) {
          results[vendor.slug] = { found: 0, priceChanges: 0, errors: 0, skipped: true };
          continue;
        }
      }

      const { data: runData } = await supabase
        .from("vendor_scrape_runs")
        .insert({ vendor_slug: vendor.slug, status: "running" })
        .select()
        .single();

      const runId = runData?.id;

      try {
        const result = await scrapeVendor(vendor, includefish, supabase);
        results[vendor.slug] = result;

        if (runId) {
          await supabase
            .from("vendor_scrape_runs")
            .update({
              completed_at: new Date().toISOString(),
              products_found: result.found,
              status: "completed",
            })
            .eq("id", runId);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results[vendor.slug] = { found: 0, priceChanges: 0, errors: 1 };
        if (runId) {
          await supabase
            .from("vendor_scrape_runs")
            .update({ status: "failed", error_message: msg })
            .eq("id", runId);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
