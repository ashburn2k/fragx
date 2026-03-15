import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CORAL_COLLECTIONS = [
  "acropora", "montipora", "pocillopora", "stylophora", "birdsnest",
  "torch-coral", "hammer-and-frogspawn", "hammer-coral", "candy-cane-corals",
  "chalices", "blastomussa", "micromussa", "duncan-corals", "goniopora",
  "mushroom-coral", "zoanthids", "scolymia", "trachyphyllia", "lobophyllia",
  "galaxea", "favia", "favites", "leptastrea", "leptoseris", "pavona",
  "pectinia", "plate-coral", "platygyra", "bubble-coral", "elegance",
  "acanthophyllia", "alveopora", "anacropora", "astreopora", "bowerbanki",
  "cyphastrea", "cynarina", "echinata", "hydnophora", "indophyllia",
  "lithophyllon", "pachyseris", "plesiastrea", "porites", "psammocora",
  "stylocoeniella", "symphyllia", "turbinaria",
];

const FISH_COLLECTIONS = [
  "clownfish-1", "tangs", "wrasses", "gobies", "blennies", "damselfish-1",
  "anthias", "basslet", "cardinal-fish", "firefish", "hawkfish", "dottyback",
  "dragonets", "pygmy-angelfish", "nano-fish", "reef-safe-fish",
];

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  product_type: string;
  tags: string[];
  body_html: string;
  images: { src: string }[];
  variants: { price: string; compare_at_price: string | null }[];
}

interface ShopifyResponse {
  products: ShopifyProduct[];
}

async function fetchCollection(collection: string, page: number): Promise<ShopifyProduct[]> {
  const url = `https://worldwidecorals.com/collections/${collection}/products.json?limit=250&page=${page}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; price-tracker/1.0)" },
  });
  if (!res.ok) return [];
  const data: ShopifyResponse = await res.json();
  return data.products ?? [];
}

async function scrapeCollection(
  collection: string,
  supabase: ReturnType<typeof createClient>
): Promise<{ inserted: number; updated: number; found: number }> {
  let page = 1;
  let allProducts: ShopifyProduct[] = [];

  while (true) {
    const products = await fetchCollection(collection, page);
    if (products.length === 0) break;
    allProducts = allProducts.concat(products);
    if (products.length < 250) break;
    page++;
    await new Promise(r => setTimeout(r, 300));
  }

  let inserted = 0;
  let updated = 0;

  for (const product of allProducts) {
    const variant = product.variants?.[0];
    if (!variant) continue;

    const price = parseFloat(variant.price);
    if (isNaN(price) || price <= 0) continue;

    const compareAtPrice = variant.compare_at_price ? parseFloat(variant.compare_at_price) : null;
    const imageUrl = product.images?.[0]?.src ?? null;
    const tags = Array.isArray(product.tags) ? product.tags : [];

    const record = {
      shopify_id: product.id,
      handle: product.handle,
      title: product.title,
      product_type: product.product_type ?? "",
      collection,
      price,
      compare_at_price: compareAtPrice,
      image_url: imageUrl,
      tags,
      description: product.body_html ? product.body_html.replace(/<[^>]*>/g, "").trim().slice(0, 1000) : null,
      scraped_at: new Date().toISOString(),
      is_available: true,
    };

    const { error } = await supabase
      .from("wwc_products")
      .upsert(record, { onConflict: "shopify_id" });

    if (!error) {
      const { data: existing } = await supabase
        .from("wwc_products")
        .select("id")
        .eq("shopify_id", product.id)
        .maybeSingle();
      if (existing) updated++;
      else inserted++;
    }
  }

  return { inserted, updated, found: allProducts.length };
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
    const collectionsParam: string[] | undefined = body.collections;
    const includefish: boolean = body.include_fish ?? false;

    let targetCollections = collectionsParam ?? CORAL_COLLECTIONS;
    if (includefish) targetCollections = [...targetCollections, ...FISH_COLLECTIONS];

    const { data: runData, error: runError } = await supabase
      .from("wwc_scrape_runs")
      .insert({
        collections_scraped: targetCollections,
        status: "running",
      })
      .select()
      .single();

    if (runError) throw runError;
    const runId = runData.id;

    let totalFound = 0;
    let totalInserted = 0;
    let totalUpdated = 0;

    for (const collection of targetCollections) {
      try {
        const result = await scrapeCollection(collection, supabase);
        totalFound += result.found;
        totalInserted += result.inserted;
        totalUpdated += result.updated;
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        console.error(`Error scraping ${collection}:`, err);
      }
    }

    await supabase
      .from("wwc_scrape_runs")
      .update({
        completed_at: new Date().toISOString(),
        products_found: totalFound,
        products_inserted: totalInserted,
        products_updated: totalUpdated,
        status: "completed",
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify({
        success: true,
        run_id: runId,
        collections_scraped: targetCollections.length,
        products_found: totalFound,
        products_inserted: totalInserted,
        products_updated: totalUpdated,
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
