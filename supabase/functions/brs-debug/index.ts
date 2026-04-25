const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  const baseUrl = "https://www.saltwateraquarium.com";
  const variants = [
    `${baseUrl}/control/`,
    `${baseUrl}/control`,
    `${baseUrl}/control/?limit=100`,
    `${baseUrl}/control/?page=1&limit=100`,
    `${baseUrl}/control/?Page=1`,
    `${baseUrl}/aquariums/`,
    `${baseUrl}/lighting/`,
    `${baseUrl}/control/aquarium-controllers/`,
    `${baseUrl}/control/aquarium-controllers/?page=1&limit=100`,
  ];
  const results: Record<string, number> = {};
  for (const url of variants) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Referer": baseUrl + "/",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(20000),
      });
      results[url] = res.status;
    } catch (e) {
      results[url] = -1;
    }
  }
  return new Response(JSON.stringify(results, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
