import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BUCKET = "vendor-images";

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
  is_available: boolean;
  image_url: string | null;
}

async function cacheImage(
  supabase: ReturnType<typeof createClient>,
  externalUrl: string,
  path: string
): Promise<string | null> {
  try {
    const res = await fetch(externalUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; coral-price-tracker/1.0)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, upsert: false });
    if (error && !error.message.toLowerCase().includes("already exists")) return null;
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

function resolveImageUrls(
  allRecords: Map<number, object>,
  existingMap: Map<number, ExistingProduct>,
  storagePrefix: string
): void {
  for (const [shopifyId, record] of allRecords) {
    const rec = record as Record<string, unknown>;
    const existing = existingMap.get(shopifyId);
    if (typeof existing?.image_url === "string" && existing.image_url.startsWith(storagePrefix)) {
      rec.image_url = existing.image_url;
    }
  }
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

async function fetchAllPages(baseUrl: string, path: string, maxPages = 100): Promise<ShopifyProduct[]> {
  const all: ShopifyProduct[] = [];
  let page = 1;
  while (page <= maxPages) {
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

async function fetchHtmlPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  prices: {
    price: string;
    regular_price: string;
    sale_price: string;
    currency_minor_unit: number;
  };
  images: { src: string }[];
  categories: { id: number; name: string; slug: string }[];
  tags: { id: number; name: string; slug: string }[];
  short_description: string;
  is_in_stock: boolean;
  on_sale: boolean;
}

function buildWooCommerceRecord(
  product: WooCommerceProduct,
  vendorSlug: string,
  collection: string
): object | null {
  const minorUnit = product.prices.currency_minor_unit ?? 2;
  const divisor = Math.pow(10, minorUnit);
  const price = parseInt(product.prices.price) / divisor;
  const regularPrice = parseInt(product.prices.regular_price) / divisor;
  if (isNaN(price) || price <= 0) return null;
  const compareAtPrice = product.on_sale && regularPrice > price ? regularPrice : null;
  return {
    vendor_slug: vendorSlug,
    shopify_id: product.id,
    handle: product.slug,
    title: product.name,
    product_type: collection,
    collection,
    price,
    compare_at_price: compareAtPrice,
    image_url: product.images?.[0]?.src ?? null,
    tags: product.tags?.map(t => t.slug) ?? [],
    description: product.short_description
      ? product.short_description.replace(/<[^>]*>/g, "").trim().slice(0, 1000)
      : null,
    scraped_at: new Date().toISOString(),
    is_available: product.is_in_stock,
  };
}

async function scrapeWooCommerceVendor(
  vendor: VendorConfig,
  supabase: ReturnType<typeof createClient>
): Promise<{ found: number; priceChanges: number; errors: number }> {
  const { data: existingRaw } = await supabase
    .from("vendor_products")
    .select("shopify_id, price, handle, title, image_url, is_available")
    .eq("vendor_slug", vendor.slug)
    .limit(100000);

  const existingMap = new Map<number, ExistingProduct>();
  for (const p of (existingRaw ?? [])) {
    existingMap.set(p.shopify_id, p);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const storagePrefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET}`;

  const allRecords = new Map<number, object>();
  const seenIds = new Set<number>();
  const PER_PAGE = 100;

  const collections = vendor.coral_collections.length > 0 ? vendor.coral_collections : ["all-products"];

  for (const categorySlug of collections) {
    let page = 1;
    while (true) {
      const url = `${vendor.base_url}/wp-json/wc/store/v1/products?per_page=${PER_PAGE}&page=${page}&category=${categorySlug}&orderby=date&order=desc`;
      let products: WooCommerceProduct[] = [];
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; coral-price-tracker/1.0)" },
          signal: AbortSignal.timeout(25000),
        });
        if (!res.ok) break;
        products = await res.json();
      } catch {
        break;
      }
      if (!Array.isArray(products) || products.length === 0) break;

      for (const product of products) {
        if (seenIds.has(product.id)) continue;
        const record = buildWooCommerceRecord(product, vendor.slug, categorySlug);
        if (!record) continue;
        allRecords.set(product.id, record);
        seenIds.add(product.id);
      }

      if (products.length < PER_PAGE) break;
      page++;
      await new Promise(r => setTimeout(r, 300));
    }
    await new Promise(r => setTimeout(r, 200));
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
    } else {
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
    }
  }

  resolveImageUrls(allRecords, existingMap, storagePrefix);

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

  // Products that existed before but weren't returned by this scrape are unlisted/sold out
  const unavailableIds = [...existingMap.keys()].filter(id => !allRecords.has(id));
  if (unavailableIds.length > 0) {
    const UBATCH = 500;
    for (let i = 0; i < unavailableIds.length; i += UBATCH) {
      await supabase
        .from("vendor_products")
        .update({ is_available: false })
        .eq("vendor_slug", vendor.slug)
        .in("shopify_id", unavailableIds.slice(i, i + UBATCH));
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


  await supabase
    .from("vendor_scrape_configs")
    .update({ last_scraped_at: new Date().toISOString() })
    .eq("slug", vendor.slug);

  // Fire notifications for products that changed this scrape (fire-and-forget)
  const notifyEvents: object[] = [];
  for (const id of unavailableIds) {
    const ex = existingMap.get(id);
    if (ex?.is_available !== false) {
      notifyEvents.push({
        vendor_slug: vendor.slug,
        shopify_id: id,
        product_title: ex?.title ?? '',
        product_handle: ex?.handle ?? '',
        vendor_base_url: vendor.base_url,
        event_type: 'sold_out',
      });
    }
  }
  for (const h of historyRecords as any[]) {
    if (h.price_change !== null && h.price_change !== 0) {
      notifyEvents.push({
        vendor_slug: h.vendor_slug,
        shopify_id: h.shopify_id,
        product_title: h.title,
        product_handle: h.handle,
        vendor_base_url: vendor.base_url,
        event_type: h.price_change < 0 ? 'price_drop' : 'price_increase',
        old_price: Math.round((h.price - h.price_change) * 100) / 100,
        new_price: h.price,
      });
    }
  }
  if (notifyEvents.length > 0) {
    fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-product-notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
      body: JSON.stringify({ events: notifyEvents }),
    }).catch(e => console.error('Notification trigger failed:', e));
  }

  return { found: totalFound, priceChanges: historyRecords.filter((h: any) => h.price_change !== null).length, errors };
}

async function discoverMagentoProductUrls(
  baseUrl: string,
  knownHandles: Set<string>
): Promise<string[]> {
  const domain = new URL(baseUrl).hostname;
  const prefixes = ["stock-", "wysiwyg-"];
  const fetchCdx = async (prefix: string): Promise<string[]> => {
    const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${domain}/${prefix}*&output=json&fl=original&collapse=urlkey&matchType=prefix&limit=3000&filter=statuscode:200`;
    try {
      const res = await fetch(cdxUrl, { signal: AbortSignal.timeout(30000), headers: { "User-Agent": "coral-price-tracker/1.0" } });
      if (!res.ok) return [];
      const rows: string[][] = await res.json();
      const found: string[] = [];
      for (const row of rows.slice(1)) {
        const url = row[0];
        if (!url || !url.endsWith(".html")) continue;
        const m = url.match(/\/([^/?#]+\.html)$/);
        if (!m) continue;
        const handle = m[1];
        if (!knownHandles.has(handle)) found.push(handle);
      }
      return found;
    } catch {
      return [];
    }
  };
  try {
    const results = await Promise.all(prefixes.map(fetchCdx));
    return [...new Set(results.flat())];
  } catch {
    return [];
  }
}

async function scrapeMagentoProductPage(
  baseUrl: string,
  handle: string
): Promise<{ id: number; title: string; price: number; image_url: string | null; collection: string; is_available: boolean } | null> {
  const html = await fetchHtmlPage(`${baseUrl}/${handle}`);
  if (!html) return null;
  const ldBlocks = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) ?? [];
  let productLd: Record<string, unknown> | null = null;
  for (const block of ldBlocks) {
    const content = block.replace(/<script[^>]*>/, "").replace(/<\/script>/, "");
    try {
      const obj = JSON.parse(content);
      if (obj["@type"] === "Product") { productLd = obj; break; }
    } catch { /* skip */ }
  }
  if (!productLd) return null;
  const idMatch = html.match(/"item_id"\s*:\s*"?(\d+)"?/) ?? html.match(/"productId"\s*:\s*"?(\d+)"?/);
  if (!idMatch) return null;
  const id = parseInt(idMatch[1]);
  if (!id) return null;
  const offer = Array.isArray(productLd.offers) ? (productLd.offers as Record<string, unknown>[])[0] : productLd.offers as Record<string, unknown>;
  if (!offer) return null;
  const price = parseFloat((offer.price ?? offer.lowPrice ?? 0) as string);
  if (!price || price <= 0) return null;
  const isAvailable = String(offer.availability ?? "").includes("InStock");
  const catMatch = html.match(/"item_category"\s*:\s*"([^"]+)"/);
  const collection = catMatch ? catMatch[1].toLowerCase().replace(/\s+/g, "-") : "corals";
  const img = typeof productLd.image === "string" ? productLd.image
    : Array.isArray(productLd.image) ? (productLd.image as string[])[0]
    : (productLd.image as Record<string, string> | null)?.url ?? null;
  return { id, title: productLd.name as string, price, image_url: img ? (img as string).split("?")[0] : null, collection, is_available: isAvailable };
}

interface MagentoGraphQLProduct {
  id: number;
  name: string;
  sku: string;
  url_key: string;
  stock_status: "IN_STOCK" | "OUT_OF_STOCK";
  image: { url: string } | null;
  price_range: {
    minimum_price: {
      regular_price: { value: number };
      final_price: { value: number };
    };
  };
}

async function fetchMagentoGraphQLProducts(
  baseUrl: string,
  categoryUrlKey: string
): Promise<MagentoGraphQLProduct[]> {
  const all: MagentoGraphQLProduct[] = [];
  let page = 1;
  while (true) {
    const query = `{ categoryList(filters: { url_key: { eq: "${categoryUrlKey}" } }) { products(pageSize: 300, currentPage: ${page}) { total_count items { id name sku url_key stock_status image { url } price_range { minimum_price { regular_price { value } final_price { value } } } } } } }`;
    let items: MagentoGraphQLProduct[] = [];
    try {
      const res = await fetch(`${baseUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; coral-price-tracker/1.0)",
        },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) break;
      const data = await res.json();
      items = data?.data?.categoryList?.[0]?.products?.items ?? [];
    } catch {
      break;
    }
    if (items.length === 0) break;
    all.push(...items);
    if (items.length < 300) break;
    page++;
    await new Promise(r => setTimeout(r, 300));
  }
  return all;
}

interface MagentoItem {
  item_name: string;
  item_id: string;
  price: string;
  item_category?: string;
}

function parseMagentoProductsFromHtml(html: string, vendorSlug: string, baseUrl: string, collection: string, allCollectionPaths: string[] = []): object[] {
  const items: MagentoItem[] = [];
  const itemRegex = /\{"item_name":"([^"]+)","item_id":"(\d+)","price":"([\d.]+)"[^}]*\}/g;
  let m;
  const seenIds = new Set<string>();
  while ((m = itemRegex.exec(html)) !== null) {
    if (!seenIds.has(m[2])) {
      items.push({ item_name: m[1], item_id: m[2], price: m[3] });
      seenIds.add(m[2]);
    }
  }

  const domain = baseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  if (items.length > 0) {
    // GTM data found — match handles and images by position
    const linkPattern = new RegExp(`href="https://${domain.replace(/\./g, "\\.")}/(([\\w-]+)\\.html)"`, "g");
    const linkPositions: { pos: number; handle: string }[] = [];
    let lm;
    while ((lm = linkPattern.exec(html)) !== null) {
      linkPositions.push({ pos: lm.index, handle: lm[1] });
    }

    const imgPattern = /(?:data-src|src)="([^"]*\/media\/catalog\/product\/[^"]+\.(?:jpg|jpeg|png|webp)(?:\?[^"]*)?)"/gi;
    const imgPositions: { pos: number; url: string }[] = [];
    let im;
    while ((im = imgPattern.exec(html)) !== null) {
      const raw = im[1];
      const url = (raw.startsWith("http") ? raw : `${baseUrl}${raw}`).split("?")[0];
      imgPositions.push({ pos: im.index, url });
    }

    const handleImageMap = new Map<string, string>();
    for (let i = 0; i < linkPositions.length; i++) {
      const { pos, handle } = linkPositions[i];
      if (handleImageMap.has(handle)) continue;
      const nextLinkPos = i + 1 < linkPositions.length ? linkPositions[i + 1].pos : html.length;
      const nearbyImg = imgPositions.find(img => img.pos > pos && img.pos < nextLinkPos);
      if (nearbyImg) handleImageMap.set(handle, nearbyImg.url);
    }

    const allHandles = linkPositions.map(l => l.handle).filter((h, i, arr) => arr.indexOf(h) === i);

    function slugifyName(name: string): string {
      return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }

    const usedHandles = new Set<string>();

    return items.map((item) => {
      const price = parseFloat(item.price);
      if (isNaN(price) || price <= 0) return null;
      const nameSlug = slugifyName(item.item_name);
      const matchedHandle = allHandles.find(h => !usedHandles.has(h) && h.includes(nameSlug));
      let handle: string;
      if (matchedHandle) {
        handle = matchedHandle;
        usedHandles.add(matchedHandle);
      } else {
        handle = `${item.item_id}.html`;
      }
      return {
        vendor_slug: vendorSlug,
        shopify_id: parseInt(item.item_id),
        handle,
        title: item.item_name,
        product_type: item.item_category ?? "coral",
        collection,
        price,
        compare_at_price: null,
        image_url: handleImageMap.get(handle) ?? null,
        tags: [],
        description: null,
        scraped_at: new Date().toISOString(),
        is_available: true,
      };
    }).filter(Boolean);
  }

  // Fallback: no GTM data — parse product URLs, names, and prices directly from HTML.
  // Works for Magento stores like BulkReefSupply where products live under a category prefix
  // e.g. https://www.bulkreefsupply.com/live-goods/product-name.html
  const productLinkRe = new RegExp(
    `href="https?://${domain.replace(/\./g, "\\.")}(/(?![^"]*\\?)[\\w/-]+\\.html)"`,
    "g"
  );

  // Build a set of category/navigation handles to skip
  const skipHandles = new Set<string>([
    collection,
    collection + ".html",
    ...allCollectionPaths.map(p => p.replace(/^\//, "")),
    ...allCollectionPaths.map(p => p.replace(/^\//, "").replace(/\.html$/, "")),
  ]);

  const productEntries: Array<{ handle: string; pos: number }> = [];
  const seenHandles = new Set<string>();
  let pl;
  while ((pl = productLinkRe.exec(html)) !== null) {
    const handle = pl[1].replace(/^\//, "");
    if (skipHandles.has(handle)) continue;
    // Skip system/navigation paths
    if (/^(?:categories|customer|checkout|cart|search|catalogsearch|wishlist|account|cms|contact|returns|info)/.test(handle)) continue;
    // Skip paths deeper than one category level (3+ segments)
    if ((handle.match(/\//g) ?? []).length >= 2) continue;
    if (!seenHandles.has(handle)) {
      productEntries.push({ handle, pos: pl.index });
      seenHandles.add(handle);
    }
  }

  if (productEntries.length === 0) return [];

  const fallbackResults: object[] = [];
  const seenFallbackIds = new Set<number>();

  for (let i = 0; i < productEntries.length; i++) {
    const { handle, pos } = productEntries[i];
    const nextPos = i + 1 < productEntries.length ? productEntries[i + 1].pos : Math.min(html.length, pos + 5000);
    const block = html.slice(pos, nextPos);

    // Name from alt attribute (most reliable in Magento product cards)
    const altMatch = block.match(/alt="([^"]{3,120})"/);
    // Or from link text
    const linkTextMatch = block.match(/<a[^>]+class="[^"]*(?:product-item-link|product-name)[^"]*"[^>]*>\s*([^<]{3,120})\s*<\/a>/i)
      ?? block.match(/class="[^"]*product-item-name[^"]*"[^>]*>[\s\S]{0,100}?<a[^>]*>([^<]{3,120})<\/a>/i);
    const name = linkTextMatch?.[1]?.trim() ?? altMatch?.[1]?.trim();
    if (!name || name.length < 3) continue;

    // Price: first $X.XX in the block
    const priceMatch = block.match(/\$([\d,]+\.\d{2})/);
    if (!priceMatch) continue;
    const price = parseFloat(priceMatch[1].replace(/,/g, ""));
    if (isNaN(price) || price <= 0) continue;

    // Image: media/catalog CDN or any img src in the block
    const imgMatch = block.match(/(?:data-src|src)="([^"]*\/media\/catalog\/product\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i)
      ?? block.match(/(?:data-src|src)="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i);
    const imageUrl = imgMatch ? (imgMatch[1].startsWith("http") ? imgMatch[1] : `${baseUrl}${imgMatch[1]}`).split("?")[0] : null;

    const id = hashStringToBigint(handle);
    if (seenFallbackIds.has(id)) continue;
    seenFallbackIds.add(id);

    fallbackResults.push({
      vendor_slug: vendorSlug,
      shopify_id: id,
      handle,
      title: name,
      product_type: collection,
      collection,
      price,
      compare_at_price: null,
      image_url: imageUrl,
      tags: [],
      description: null,
      scraped_at: new Date().toISOString(),
      is_available: true,
    });
  }

  return fallbackResults;
}

async function scrapeMagentoVendor(
  vendor: VendorConfig,
  supabase: ReturnType<typeof createClient>
): Promise<{ found: number; priceChanges: number; errors: number }> {
  const { data: existingRaw } = await supabase
    .from("vendor_products")
    .select("shopify_id, price, handle, title, image_url, is_available")
    .eq("vendor_slug", vendor.slug)
    .limit(100000);

  const existingMap = new Map<number, ExistingProduct>();
  for (const p of (existingRaw ?? [])) {
    existingMap.set(p.shopify_id, p);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const storagePrefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET}`;

  const allRecords = new Map<number, object>();
  const seenIds = new Set<number>();

  for (const catalogPath of vendor.coral_collections) {
    let page = 1;
    while (true) {
      const url = `${vendor.base_url}/${catalogPath}?product_list_limit=96&p=${page}`;
      const html = await fetchHtmlPage(url);
      if (!html) break;

      const allCollPaths = [...(vendor.coral_collections ?? []), ...(vendor.fish_collections ?? [])];
      const products = parseMagentoProductsFromHtml(html, vendor.slug, vendor.base_url, catalogPath.replace(/\.html$/, ""), allCollPaths);
      if (products.length === 0) break;

      let newCount = 0;
      for (const product of products) {
        const rec = product as { shopify_id: number };
        if (!seenIds.has(rec.shopify_id)) {
          allRecords.set(rec.shopify_id, product);
          seenIds.add(rec.shopify_id);
          newCount++;
        }
      }

      // Stop if this page added nothing new (some Magento stores ignore ?p= and
      // return the same product set on every page, causing an infinite loop).
      if (newCount === 0) break;
      if (products.length < 96) break;
      if (page >= 20) break;
      page++;
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Persist HTML-parsed products immediately so a timeout in later enrichment
  // (GraphQL, CDX archive lookups) doesn't lose the main scrape result.
  if (allRecords.size > 0) {
    const earlyArr = Array.from(allRecords.values());
    resolveImageUrls(allRecords, existingMap, storagePrefix);
    const EBATCH = 250;
    for (let i = 0; i < earlyArr.length; i += EBATCH) {
      await supabase
        .from("vendor_products")
        .upsert(earlyArr.slice(i, i + EBATCH), { onConflict: "vendor_slug,shopify_id" });
    }
    await supabase
      .from("vendor_scrape_configs")
      .update({ last_scraped_at: new Date().toISOString() })
      .eq("slug", vendor.slug);
  }

  for (const catalogPath of vendor.coral_collections) {
    const urlKey = catalogPath.replace(/\.html$/, "");
    const gqlProducts = await fetchMagentoGraphQLProducts(vendor.base_url, urlKey);
    for (const gp of gqlProducts) {
      if (seenIds.has(gp.id)) continue;
      const regularPrice = gp.price_range?.minimum_price?.regular_price?.value ?? 0;
      const finalPrice = gp.price_range?.minimum_price?.final_price?.value ?? 0;
      const price = finalPrice > 0 ? finalPrice : regularPrice;
      if (price <= 0) continue;
      const isAvailable = gp.stock_status === "IN_STOCK";
      const imageUrl = gp.image?.url
        ? gp.image.url.split("?")[0]
        : null;
      allRecords.set(gp.id, {
        vendor_slug: vendor.slug,
        shopify_id: gp.id,
        handle: `${gp.url_key}.html`,
        title: gp.name,
        product_type: urlKey,
        collection: urlKey,
        price,
        compare_at_price: regularPrice > finalPrice && finalPrice > 0 ? regularPrice : null,
        image_url: imageUrl,
        tags: [],
        description: null,
        scraped_at: new Date().toISOString(),
        is_available: isAvailable,
      });
      seenIds.add(gp.id);
    }
    await new Promise(r => setTimeout(r, 300));
  }

  const seenHandles = new Set<string>();
  for (const r of allRecords.values()) seenHandles.add((r as { handle: string }).handle);
  for (const r of existingMap.values()) seenHandles.add(r.handle);
  const newHandles = await discoverMagentoProductUrls(vendor.base_url, seenHandles);
  console.log(`[${vendor.slug}] CDX discovery: ${newHandles.length} new handles`);
  const CDX_BATCH = 10;
  for (let i = 0; i < Math.min(newHandles.length, 200); i += CDX_BATCH) {
    const batch = newHandles.slice(i, i + CDX_BATCH);
    const results = await Promise.all(batch.map(h => scrapeMagentoProductPage(vendor.base_url, h)));
    for (let j = 0; j < results.length; j++) {
      const product = results[j];
      const handle = batch[j];
      if (!product || seenIds.has(product.id)) continue;
      allRecords.set(product.id, {
        vendor_slug: vendor.slug,
        shopify_id: product.id,
        handle,
        title: product.title,
        product_type: product.collection,
        collection: product.collection,
        price: product.price,
        compare_at_price: null,
        image_url: product.image_url,
        tags: [],
        description: null,
        scraped_at: new Date().toISOString(),
        is_available: product.is_available,
      });
      seenIds.add(product.id);
    }
    if (i + CDX_BATCH < newHandles.length) await new Promise(r => setTimeout(r, 200));
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
    } else {
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
    }
  }

  resolveImageUrls(allRecords, existingMap, storagePrefix);

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

  // Products that existed before but weren't returned by this scrape are unlisted/sold out
  const unavailableIds = [...existingMap.keys()].filter(id => !allRecords.has(id));
  if (unavailableIds.length > 0) {
    const UBATCH = 500;
    for (let i = 0; i < unavailableIds.length; i += UBATCH) {
      await supabase
        .from("vendor_products")
        .update({ is_available: false })
        .eq("vendor_slug", vendor.slug)
        .in("shopify_id", unavailableIds.slice(i, i + UBATCH));
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


  await supabase
    .from("vendor_scrape_configs")
    .update({ last_scraped_at: new Date().toISOString() })
    .eq("slug", vendor.slug);

  // Fire notifications for products that changed this scrape (fire-and-forget)
  const notifyEvents: object[] = [];
  for (const id of unavailableIds) {
    const ex = existingMap.get(id);
    if (ex?.is_available !== false) {
      notifyEvents.push({
        vendor_slug: vendor.slug,
        shopify_id: id,
        product_title: ex?.title ?? '',
        product_handle: ex?.handle ?? '',
        vendor_base_url: vendor.base_url,
        event_type: 'sold_out',
      });
    }
  }
  for (const h of historyRecords as any[]) {
    if (h.price_change !== null && h.price_change !== 0) {
      notifyEvents.push({
        vendor_slug: h.vendor_slug,
        shopify_id: h.shopify_id,
        product_title: h.title,
        product_handle: h.handle,
        vendor_base_url: vendor.base_url,
        event_type: h.price_change < 0 ? 'price_drop' : 'price_increase',
        old_price: Math.round((h.price - h.price_change) * 100) / 100,
        new_price: h.price,
      });
    }
  }
  if (notifyEvents.length > 0) {
    fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-product-notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
      body: JSON.stringify({ events: notifyEvents }),
    }).catch(e => console.error('Notification trigger failed:', e));
  }

  return { found: totalFound, priceChanges: historyRecords.filter((h: any) => h.price_change !== null).length, errors };
}

// ─── BigCommerce ───────────────────────────────────────────────────────────

interface BigCommerceItem {
  id: number;
  name: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  isAvailable: boolean;
}

function parseBigCommerceProductsFromHtml(html: string, vendorSlug: string, collection: string): object[] {
  // BigCommerce category pages embed product IDs in cart.php links as product%5Fid (URL-encoded _)
  // Extract each occurrence and look at surrounding HTML for name and price.
  const productPositions: Array<{ id: number; pos: number }> = [];
  const seenIds = new Set<number>();
  const cartRe = /product(?:%5[Ff]|_)id=(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = cartRe.exec(html)) !== null) {
    const id = parseInt(m[1]);
    if (!seenIds.has(id) && id > 0) {
      productPositions.push({ id, pos: m.index });
      seenIds.add(id);
    }
  }
  if (productPositions.length === 0) return [];

  // Pre-collect CDN images so we can pair them with products by position
  const imgPositions: Array<{ pos: number; url: string }> = [];
  const imgRe = /(?:data-src|src)="(https:\/\/cdn\d+\.bigcommerce\.com\/s-[^"]+\.(?:jpg|jpeg|png|webp)(?:\?[^"]*)?)"/gi;
  while ((m = imgRe.exec(html)) !== null) {
    imgPositions.push({ pos: m.index, url: m[1].split("?")[0] });
  }

  return productPositions.map(({ id, pos }) => {
    const WINDOW = 4000;
    const before = html.slice(Math.max(0, pos - WINDOW), pos);

    // Product name: last meaningful link text before the cart URL
    const linkMatches = [...before.matchAll(/<a[^>]+href="\/[^"]{5,100}"[^>]*>\s*([^<]{3,100})\s*<\/a>/g)];
    let name: string | null = null;
    for (let i = linkMatches.length - 1; i >= 0; i--) {
      const candidate = linkMatches[i][1].trim();
      if (candidate.length >= 3 && !/^(add|cart|view|shop|buy|more|details)/i.test(candidate)) {
        name = candidate;
        break;
      }
    }
    // Fallback: alt text of nearest product image before cart link
    if (!name) {
      const altMatch = before.match(/alt="([^"]{3,100})"\s*(?:width|height|class|style)/i);
      if (altMatch) name = altMatch[1].trim();
    }
    if (!name || name.length < 3) return null;

    // Price: last $X.XX before the cart URL
    const priceMatch = before.match(/\$([\d,]+\.\d{2})(?=[^$]*$)/);
    if (!priceMatch) return null;
    const price = parseFloat(priceMatch[1].replace(/,/g, ""));
    if (isNaN(price) || price <= 0) return null;

    // Nearest CDN image before the cart link
    const nearImg = imgPositions.filter(ip => ip.pos < pos).slice(-1)[0];

    return {
      vendor_slug: vendorSlug,
      shopify_id: id,
      handle: String(id),
      title: name,
      product_type: collection,
      collection,
      price,
      compare_at_price: null,
      image_url: nearImg?.url ?? null,
      tags: [],
      description: null,
      scraped_at: new Date().toISOString(),
      is_available: true,
    };
  }).filter(Boolean);
}

async function scrapeBigCommerceVendor(
  vendor: VendorConfig,
  supabase: ReturnType<typeof createClient>
): Promise<{ found: number; priceChanges: number; errors: number }> {
  const { data: existingRaw } = await supabase
    .from("vendor_products")
    .select("shopify_id, price, handle, title, image_url, is_available")
    .eq("vendor_slug", vendor.slug)
    .limit(100000);

  const existingMap = new Map<number, ExistingProduct>();
  for (const p of (existingRaw ?? [])) existingMap.set(p.shopify_id, p);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const storagePrefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET}`;

  const allRecords = new Map<number, object>();
  const seenIds = new Set<number>();

  for (const categoryPath of vendor.coral_collections) {
    let page = 1;
    while (true) {
      const url = `${vendor.base_url}/${categoryPath}/?page=${page}&limit=100`;
      const html = await fetchHtmlPage(url);
      if (!html) break;

      const products = parseBigCommerceProductsFromHtml(html, vendor.slug, categoryPath);
      if (products.length === 0) break;

      for (const product of products) {
        const rec = product as { shopify_id: number };
        if (!seenIds.has(rec.shopify_id)) {
          allRecords.set(rec.shopify_id, product);
          seenIds.add(rec.shopify_id);
        }
      }

      if (products.length < 100) break;
      page++;
      await new Promise(r => setTimeout(r, 500));
    }
    await new Promise(r => setTimeout(r, 300));
  }

  const historyRecords: object[] = [];
  for (const [shopifyId, record] of allRecords) {
    const rec = record as { shopify_id: number; price: number; handle: string; title: string; compare_at_price: number | null };
    const existing = existingMap.get(shopifyId);
    if (!existing) {
      historyRecords.push({ vendor_slug: vendor.slug, shopify_id: rec.shopify_id, handle: rec.handle, title: rec.title, price: rec.price, compare_at_price: rec.compare_at_price, price_change: null, price_change_pct: null, recorded_at: new Date().toISOString() });
    } else if (Math.abs(existing.price - rec.price) >= 0.01) {
      const change = rec.price - existing.price;
      historyRecords.push({ vendor_slug: vendor.slug, shopify_id: rec.shopify_id, handle: rec.handle, title: rec.title, price: rec.price, compare_at_price: rec.compare_at_price, price_change: Math.round(change * 100) / 100, price_change_pct: existing.price > 0 ? Math.round((change / existing.price) * 10000) / 100 : null, recorded_at: new Date().toISOString() });
    } else {
      historyRecords.push({ vendor_slug: vendor.slug, shopify_id: rec.shopify_id, handle: rec.handle, title: rec.title, price: rec.price, compare_at_price: rec.compare_at_price, price_change: null, price_change_pct: null, recorded_at: new Date().toISOString() });
    }
  }

  resolveImageUrls(allRecords, existingMap, storagePrefix);

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

  const unavailableIds = [...existingMap.keys()].filter(id => !allRecords.has(id));
  if (unavailableIds.length > 0) {
    const UBATCH = 500;
    for (let i = 0; i < unavailableIds.length; i += UBATCH) {
      await supabase
        .from("vendor_products")
        .update({ is_available: false })
        .eq("vendor_slug", vendor.slug)
        .in("shopify_id", unavailableIds.slice(i, i + UBATCH));
    }
  }

  if (historyRecords.length > 0) {
    const HBATCH = 500;
    for (let i = 0; i < historyRecords.length; i += HBATCH) {
      const { error } = await supabase.from("vendor_price_history").insert(historyRecords.slice(i, i + HBATCH));
      if (error) console.error(`History insert error for ${vendor.slug}:`, error.message);
    }
  }

  await supabase.from("vendor_scrape_configs").update({ last_scraped_at: new Date().toISOString() }).eq("slug", vendor.slug);

  const notifyEvents: object[] = [];
  for (const id of unavailableIds) {
    const ex = existingMap.get(id);
    if (ex?.is_available !== false) notifyEvents.push({ vendor_slug: vendor.slug, shopify_id: id, product_title: ex?.title ?? '', product_handle: ex?.handle ?? '', vendor_base_url: vendor.base_url, event_type: 'sold_out' });
  }
  for (const h of historyRecords as any[]) {
    if (h.price_change !== null && h.price_change !== 0) {
      notifyEvents.push({ vendor_slug: h.vendor_slug, shopify_id: h.shopify_id, product_title: h.title, product_handle: h.handle, vendor_base_url: vendor.base_url, event_type: h.price_change < 0 ? 'price_drop' : 'price_increase', old_price: Math.round((h.price - h.price_change) * 100) / 100, new_price: h.price });
    }
  }
  if (notifyEvents.length > 0) {
    fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-product-notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
      body: JSON.stringify({ events: notifyEvents }),
    }).catch(e => console.error('Notification trigger failed:', e));
  }

  return { found: totalFound, priceChanges: historyRecords.filter((h: any) => h.price_change !== null).length, errors };
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
    .select("shopify_id, price, handle, title, image_url, is_available")
    .eq("vendor_slug", vendor.slug)
    .limit(100000);

  const existingMap = new Map<number, ExistingProduct>();
  for (const p of (existingRaw ?? [])) {
    existingMap.set(p.shopify_id, p);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const storagePrefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET}`;

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
    } else {
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
    }
  }

  resolveImageUrls(allRecords, existingMap, storagePrefix);

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

  // Products that existed before but weren't returned by this scrape are unlisted/sold out
  const unavailableIds = [...existingMap.keys()].filter(id => !allRecords.has(id));
  if (unavailableIds.length > 0) {
    const UBATCH = 500;
    for (let i = 0; i < unavailableIds.length; i += UBATCH) {
      await supabase
        .from("vendor_products")
        .update({ is_available: false })
        .eq("vendor_slug", vendor.slug)
        .in("shopify_id", unavailableIds.slice(i, i + UBATCH));
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


  await supabase
    .from("vendor_scrape_configs")
    .update({ last_scraped_at: new Date().toISOString() })
    .eq("slug", vendor.slug);

  // Fire notifications for products that changed this scrape (fire-and-forget)
  const notifyEvents: object[] = [];
  for (const id of unavailableIds) {
    const ex = existingMap.get(id);
    if (ex?.is_available !== false) {
      notifyEvents.push({
        vendor_slug: vendor.slug,
        shopify_id: id,
        product_title: ex?.title ?? '',
        product_handle: ex?.handle ?? '',
        vendor_base_url: vendor.base_url,
        event_type: 'sold_out',
      });
    }
  }
  for (const h of historyRecords as any[]) {
    if (h.price_change !== null && h.price_change !== 0) {
      notifyEvents.push({
        vendor_slug: h.vendor_slug,
        shopify_id: h.shopify_id,
        product_title: h.title,
        product_handle: h.handle,
        vendor_base_url: vendor.base_url,
        event_type: h.price_change < 0 ? 'price_drop' : 'price_increase',
        old_price: Math.round((h.price - h.price_change) * 100) / 100,
        new_price: h.price,
      });
    }
  }
  if (notifyEvents.length > 0) {
    fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-product-notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
      body: JSON.stringify({ events: notifyEvents }),
    }).catch(e => console.error('Notification trigger failed:', e));
  }

  return { found: totalFound, priceChanges: historyRecords.filter((h: any) => h.price_change !== null).length, errors };
}

async function scrapeShopifyVendor(
  vendor: VendorConfig,
  includefish: boolean,
  supabase: ReturnType<typeof createClient>
): Promise<{ found: number; priceChanges: number; errors: number }> {
  const { data: existingRaw } = await supabase
    .from("vendor_products")
    .select("shopify_id, price, handle, title, image_url, is_available")
    .eq("vendor_slug", vendor.slug)
    .limit(100000);

  const existingMap = new Map<number, ExistingProduct>();
  for (const p of (existingRaw ?? [])) {
    existingMap.set(p.shopify_id, p);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const storagePrefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET}`;

  const seenIds = new Set<number>();
  const allRecords = new Map<number, object>();
  const historyRecords: object[] = [];

  const useProductsEndpoint = vendor.use_products_endpoint !== false;

  if (useProductsEndpoint) {
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

  const collections = useProductsEndpoint ? [] : [
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
    } else {
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
    }
  }

  resolveImageUrls(allRecords, existingMap, storagePrefix);

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

  // Products that existed before but weren't returned by this scrape are unlisted/sold out
  const unavailableIds = [...existingMap.keys()].filter(id => !allRecords.has(id));
  if (unavailableIds.length > 0) {
    const UBATCH = 500;
    for (let i = 0; i < unavailableIds.length; i += UBATCH) {
      await supabase
        .from("vendor_products")
        .update({ is_available: false })
        .eq("vendor_slug", vendor.slug)
        .in("shopify_id", unavailableIds.slice(i, i + UBATCH));
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


  await supabase
    .from("vendor_scrape_configs")
    .update({ last_scraped_at: new Date().toISOString() })
    .eq("slug", vendor.slug);

  // Fire notifications for products that changed this scrape (fire-and-forget)
  const notifyEvents: object[] = [];
  for (const id of unavailableIds) {
    const ex = existingMap.get(id);
    if (ex?.is_available !== false) {
      notifyEvents.push({
        vendor_slug: vendor.slug,
        shopify_id: id,
        product_title: ex?.title ?? '',
        product_handle: ex?.handle ?? '',
        vendor_base_url: vendor.base_url,
        event_type: 'sold_out',
      });
    }
  }
  for (const h of historyRecords as any[]) {
    if (h.price_change !== null && h.price_change !== 0) {
      notifyEvents.push({
        vendor_slug: h.vendor_slug,
        shopify_id: h.shopify_id,
        product_title: h.title,
        product_handle: h.handle,
        vendor_base_url: vendor.base_url,
        event_type: h.price_change < 0 ? 'price_drop' : 'price_increase',
        old_price: Math.round((h.price - h.price_change) * 100) / 100,
        new_price: h.price,
      });
    }
  }
  if (notifyEvents.length > 0) {
    fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-product-notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
      body: JSON.stringify({ events: notifyEvents }),
    }).catch(e => console.error('Notification trigger failed:', e));
  }

  return { found: totalFound, priceChanges: historyRecords.filter((h: any) => h.price_change !== null).length, errors };
}

function parseVolusionProductsFromHtml(html: string, vendorSlug: string, categoryId: string): object[] {
  const products: object[] = [];
  const seenCodes = new Set<string>();

  const titleLinkRegex = /href="(?:https?:\/\/[^"]*)?\/product-p\/([^"]+)\.htm"[^>]*title="([^"]+)"/gi;
  const productEntries: { code: string; title: string; pos: number }[] = [];
  let m;
  while ((m = titleLinkRegex.exec(html)) !== null) {
    const code = m[1];
    let title = m[2];
    const lastComma = title.lastIndexOf(",");
    if (lastComma > 0) {
      title = title.slice(0, lastComma).trim();
    }
    if (!seenCodes.has(code)) {
      productEntries.push({ code, title, pos: m.index });
      seenCodes.add(code);
    }
  }

  if (productEntries.length === 0) return [];

  const priceRegex = /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
  const allPrices: { price: number; pos: number }[] = [];
  priceRegex.lastIndex = 0;
  while ((m = priceRegex.exec(html)) !== null) {
    const price = parseFloat(m[1].replace(/,/g, ""));
    if (price > 0) allPrices.push({ price, pos: m.index });
  }

  const imgRegex = /(?:src|data-src)="((?:https?:)?\/\/cdn4\.volusion\.store\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi;
  const allImages: { url: string; pos: number }[] = [];
  imgRegex.lastIndex = 0;
  while ((m = imgRegex.exec(html)) !== null) {
    const raw = m[1];
    const url = raw.startsWith("//") ? `https:${raw}` : raw;
    allImages.push({ url, pos: m.index });
  }

  for (let i = 0; i < productEntries.length; i++) {
    const { code, title, pos } = productEntries[i];
    const nextPos = i + 1 < productEntries.length ? productEntries[i + 1].pos : html.length;

    const nearbyPrice = allPrices.find(p => p.pos >= pos && p.pos < nextPos);
    if (!nearbyPrice) continue;

    const nearbyImg = allImages.find(img => img.pos >= pos - 1000 && img.pos < nextPos);

    products.push({
      vendor_slug: vendorSlug,
      shopify_id: hashStringToBigint(code),
      handle: code,
      title,
      product_type: "coral",
      collection: `category-${categoryId}`,
      price: nearbyPrice.price,
      compare_at_price: null,
      image_url: nearbyImg?.url ?? null,
      tags: [],
      description: null,
      scraped_at: new Date().toISOString(),
      is_available: true,
    });
  }

  return products;
}

async function scrapeVolusionVendor(
  vendor: VendorConfig,
  supabase: ReturnType<typeof createClient>
): Promise<{ found: number; priceChanges: number; errors: number }> {
  const { data: existingRaw } = await supabase
    .from("vendor_products")
    .select("shopify_id, price, handle, title, image_url, is_available")
    .eq("vendor_slug", vendor.slug)
    .limit(100000);

  const existingMap = new Map<number, ExistingProduct>();
  for (const p of (existingRaw ?? [])) {
    existingMap.set(p.shopify_id, p);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const storagePrefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET}`;

  const allRecords = new Map<number, object>();
  const seenIds = new Set<number>();

  for (const categoryId of vendor.coral_collections) {
    let page = 1;
    while (true) {
      const url = `${vendor.base_url}/category-s/${categoryId}.htm?pagesize=300&page=${page}`;
      const html = await fetchHtmlPage(url);
      if (!html) break;

      const products = parseVolusionProductsFromHtml(html, vendor.slug, categoryId);
      if (products.length === 0) break;

      for (const product of products) {
        const rec = product as { shopify_id: number };
        if (!seenIds.has(rec.shopify_id)) {
          allRecords.set(rec.shopify_id, product);
          seenIds.add(rec.shopify_id);
        }
      }

      const pageMatch = /Page\s+\d+\s+of\s+(\d+)/i.exec(html);
      const totalPages = pageMatch ? parseInt(pageMatch[1]) : 1;
      if (page >= totalPages || products.length === 0) break;
      page++;
      await new Promise(r => setTimeout(r, 500));
    }
    await new Promise(r => setTimeout(r, 300));
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
    } else {
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
    }
  }

  resolveImageUrls(allRecords, existingMap, storagePrefix);

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

  // Products that existed before but weren't returned by this scrape are unlisted/sold out
  const unavailableIds = [...existingMap.keys()].filter(id => !allRecords.has(id));
  if (unavailableIds.length > 0) {
    const UBATCH = 500;
    for (let i = 0; i < unavailableIds.length; i += UBATCH) {
      await supabase
        .from("vendor_products")
        .update({ is_available: false })
        .eq("vendor_slug", vendor.slug)
        .in("shopify_id", unavailableIds.slice(i, i + UBATCH));
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


  await supabase
    .from("vendor_scrape_configs")
    .update({ last_scraped_at: new Date().toISOString() })
    .eq("slug", vendor.slug);

  // Fire notifications for products that changed this scrape (fire-and-forget)
  const notifyEvents: object[] = [];
  for (const id of unavailableIds) {
    const ex = existingMap.get(id);
    if (ex?.is_available !== false) {
      notifyEvents.push({
        vendor_slug: vendor.slug,
        shopify_id: id,
        product_title: ex?.title ?? '',
        product_handle: ex?.handle ?? '',
        vendor_base_url: vendor.base_url,
        event_type: 'sold_out',
      });
    }
  }
  for (const h of historyRecords as any[]) {
    if (h.price_change !== null && h.price_change !== 0) {
      notifyEvents.push({
        vendor_slug: h.vendor_slug,
        shopify_id: h.shopify_id,
        product_title: h.title,
        product_handle: h.handle,
        vendor_base_url: vendor.base_url,
        event_type: h.price_change < 0 ? 'price_drop' : 'price_increase',
        old_price: Math.round((h.price - h.price_change) * 100) / 100,
        new_price: h.price,
      });
    }
  }
  if (notifyEvents.length > 0) {
    fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-product-notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
      body: JSON.stringify({ events: notifyEvents }),
    }).catch(e => console.error('Notification trigger failed:', e));
  }

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
  if (vendor.platform === "magento") {
    return scrapeMagentoVendor(vendor, supabase);
  }
  if (vendor.platform === "bigcommerce") {
    return scrapeBigCommerceVendor(vendor, supabase);
  }
  if (vendor.platform === "woocommerce") {
    return scrapeWooCommerceVendor(vendor, supabase);
  }
  if (vendor.platform === "volusion") {
    return scrapeVolusionVendor(vendor, supabase);
  }
  return scrapeShopifyVendor(vendor, includefish, supabase);
}

async function runScrapeJob(
  vendors: (VendorConfig & { last_scraped_at: string | null })[],
  includefish: boolean,
  force: boolean,
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  const now = Date.now();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  for (const vendor of vendors) {
    if (!force && vendor.last_scraped_at) {
      const lastMs = new Date(vendor.last_scraped_at).getTime();
      if (now - lastMs < THIRTY_DAYS_MS) continue;
    }

    const { data: runData } = await supabase
      .from("vendor_scrape_runs")
      .insert({ vendor_slug: vendor.slug, status: "running" })
      .select()
      .single();

    const runId = runData?.id;

    try {
      const result = await scrapeVendor(vendor, includefish, supabase);

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
      if (runId) {
        await supabase
          .from("vendor_scrape_runs")
          .update({ status: "failed", error_message: msg })
          .eq("id", runId);
      }
    }
  }
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

    const scrapePromise = runScrapeJob(
      vendors as (VendorConfig & { last_scraped_at: string | null })[],
      includefish,
      force,
      supabase
    );

    // Return immediately so pg_net / callers don't time out waiting.
    // EdgeRuntime.waitUntil keeps the execution context alive until the
    // scrape job finishes writing products and price history to the DB.
    EdgeRuntime.waitUntil(scrapePromise);

    return new Response(
      JSON.stringify({ success: true, scraped: vendors.map((v: VendorConfig) => v.slug) }),
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
