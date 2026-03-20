import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BUCKET = "vendor-images";

async function cacheImage(
  supabase: ReturnType<typeof createClient>,
  externalUrl: string,
  path: string
): Promise<string | null> {
  try {
    const res = await fetch(externalUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Referer": new URL(externalUrl).origin + "/",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength < 512) return null;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, upsert: true });

    if (error && !error.message.toLowerCase().includes("already exists")) {
      return null;
    }

    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

function extractOgImage(html: string): string | null {
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch) return ogMatch[1];

  const ldMatch = html.match(/"image"\s*:\s*"([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i);
  if (ldMatch) return ldMatch[1];

  return null;
}

async function enrichNullImageProducts(
  supabase: ReturnType<typeof createClient>,
  enrichLimit: number
): Promise<{ enriched: number; failed: number }> {
  const { data: vendors } = await supabase
    .from("vendor_scrape_configs")
    .select("slug, base_url, platform")
    .eq("is_active", true)
    .not("platform", "eq", "venderup");

  if (!vendors || vendors.length === 0) {
    return { enriched: 0, failed: 0 };
  }

  let enriched = 0;
  let failed = 0;

  for (const vendor of vendors) {
    const remaining = enrichLimit - enriched - failed;
    if (remaining <= 0) break;

    const { data: products } = await supabase
      .from("vendor_products")
      .select("id, handle, shopify_id")
      .eq("vendor_slug", vendor.slug)
      .is("image_url", null)
      .eq("is_available", true)
      .limit(Math.min(remaining, 20));

    if (!products || products.length === 0) continue;

    for (const product of products) {
      const productUrl = product.handle.endsWith(".html")
        ? `${vendor.base_url}/${product.handle}`
        : `${vendor.base_url}/products/${product.handle}`;

      try {
        const res = await fetch(productUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          signal: AbortSignal.timeout(20000),
        });

        if (!res.ok) {
          failed++;
          continue;
        }

        const html = await res.text();
        const imageUrl = extractOgImage(html);

        if (imageUrl) {
          const path = `${vendor.slug}/${product.shopify_id}`;
          const cachedUrl = await cacheImage(supabase, imageUrl, path);
          await supabase
            .from("vendor_products")
            .update({ image_url: cachedUrl ?? imageUrl })
            .eq("id", product.id);
          enriched++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }

      await new Promise(r => setTimeout(r, 300));
    }
  }

  return { enriched, failed };
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const storagePrefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET}`;

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const limit: number = body.limit ?? 100;
    const enrichLimit: number = body.enrich_limit ?? 50;

    const enrichResult = await enrichNullImageProducts(supabase, enrichLimit);

    let vendorCached = 0;
    let vendorFailed = 0;
    let wwcCached = 0;
    let wwcFailed = 0;

    const { data: vendorProducts } = await supabase
      .from("vendor_products")
      .select("id, vendor_slug, shopify_id, image_url")
      .not("image_url", "is", null)
      .not("image_url", "like", `${storagePrefix}%`)
      .limit(limit);

    for (const product of vendorProducts ?? []) {
      const path = `${product.vendor_slug}/${product.shopify_id}`;
      const cachedUrl = await cacheImage(supabase, product.image_url, path);
      if (cachedUrl) {
        await supabase
          .from("vendor_products")
          .update({ image_url: cachedUrl })
          .eq("id", product.id);
        vendorCached++;
      } else {
        vendorFailed++;
      }
    }

    const wwcLimit = Math.max(0, limit - (vendorProducts?.length ?? 0));
    if (wwcLimit > 0) {
      const { data: wwcProducts } = await supabase
        .from("wwc_products")
        .select("id, shopify_id, image_url")
        .not("image_url", "is", null)
        .not("image_url", "like", `${storagePrefix}%`)
        .limit(wwcLimit);

      for (const product of wwcProducts ?? []) {
        const path = `wwc/${product.shopify_id}`;
        const cachedUrl = await cacheImage(supabase, product.image_url, path);
        if (cachedUrl) {
          await supabase
            .from("wwc_products")
            .update({ image_url: cachedUrl })
            .eq("id", product.id);
          wwcCached++;
        } else {
          wwcFailed++;
        }
      }
    }

    const totalRemaining = await Promise.all([
      supabase
        .from("vendor_products")
        .select("id", { count: "exact", head: true })
        .not("image_url", "is", null)
        .not("image_url", "like", `${storagePrefix}%`),
      supabase
        .from("wwc_products")
        .select("id", { count: "exact", head: true })
        .not("image_url", "is", null)
        .not("image_url", "like", `${storagePrefix}%`),
    ]);

    const remaining = (totalRemaining[0].count ?? 0) + (totalRemaining[1].count ?? 0);

    return new Response(
      JSON.stringify({
        success: true,
        null_image_enrichment: enrichResult,
        vendor_products: { cached: vendorCached, failed: vendorFailed },
        wwc_products: { cached: wwcCached, failed: wwcFailed },
        remaining_uncached: remaining,
      }),
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
