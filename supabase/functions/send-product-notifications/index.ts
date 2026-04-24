import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type EventType = 'sold_out' | 'price_drop' | 'price_increase' | 'back_in_stock';

interface ProductEvent {
  vendor_slug: string;
  shopify_id: number;
  product_title: string;
  product_handle: string;
  vendor_base_url: string;
  event_type: EventType;
  old_price?: number;
  new_price?: number;
}

interface NotifyPayload {
  events: ProductEvent[];
}

function buildProductUrl(baseUrl: string, handle: string): string {
  return handle.endsWith('.html') ? `${baseUrl}/${handle}` : `${baseUrl}/products/${handle}`;
}

function buildEmailHtml(
  event: ProductEvent,
  productUrl: string,
  preferences: { notify_via_email: boolean; notify_via_sms: boolean }
): string {
  const isDropped = event.event_type === 'price_drop';
  const isIncreased = event.event_type === 'price_increase';
  const isSoldOut = event.event_type === 'sold_out';
  const isBackInStock = event.event_type === 'back_in_stock';

  let badgeColor = '#0891b2';
  let badgeText = 'Price Alert';
  let headlineText = '';
  let subText = '';

  if (isSoldOut) {
    badgeColor = '#475569';
    badgeText = 'SOLD OUT';
    headlineText = 'Item Sold Out';
    subText = `<strong>${event.product_title}</strong> is now sold out or unlisted at the vendor.`;
  } else if (isBackInStock) {
    badgeColor = '#059669';
    badgeText = 'BACK IN STOCK';
    headlineText = 'Back in Stock!';
    subText = `<strong>${event.product_title}</strong> is available again.`;
  } else if (isDropped) {
    badgeColor = '#16a34a';
    badgeText = 'PRICE DROP';
    headlineText = `Price dropped to $${event.new_price!.toFixed(2)}`;
    subText = `<strong>${event.product_title}</strong> dropped from <span style="text-decoration:line-through;">$${event.old_price!.toFixed(2)}</span> to <strong style="color:#4ade80;">$${event.new_price!.toFixed(2)}</strong>.`;
  } else if (isIncreased) {
    badgeColor = '#dc2626';
    badgeText = 'PRICE INCREASE';
    headlineText = `Price increased to $${event.new_price!.toFixed(2)}`;
    subText = `<strong>${event.product_title}</strong> increased from <span style="text-decoration:line-through;">$${event.old_price!.toFixed(2)}</span> to <strong style="color:#f87171;">$${event.new_price!.toFixed(2)}</strong>.`;
  }

  const buttonHtml = !isSoldOut
    ? `<a href="${productUrl}" style="display:inline-block;background:#0891b2;color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:10px;margin-top:20px;">View Product</a>`
    : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 0;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
        <tr>
          <td style="padding:0 16px 24px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#22d3ee;letter-spacing:-0.5px;">FragX</p>
            <p style="margin:2px 0 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Coral Marketplace</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 16px;">
            <div style="background:#1e293b;border:1px solid #334155;border-radius:16px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,#164e63,#0f2a1f);padding:24px 24px 16px;">
                <span style="display:inline-block;background:${badgeColor};color:#fff;font-size:10px;font-weight:700;padding:3px 10px;border-radius:999px;letter-spacing:1px;margin-bottom:10px;">${badgeText}</span>
                <h1 style="margin:0;font-size:20px;font-weight:700;color:#f1f5f9;line-height:1.3;">${headlineText}</h1>
              </div>
              <div style="padding:20px 24px;">
                <p style="margin:0 0 16px;font-size:14px;color:#94a3b8;line-height:1.6;">${subText}</p>
                <p style="margin:0;font-size:12px;color:#64748b;">Vendor: <span style="color:#cbd5e1;">${event.vendor_slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span></p>
                ${buttonHtml}
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 16px 0;">
            <p style="margin:0;font-size:12px;color:#475569;text-align:center;">
              You're receiving this because you're watching this product on FragX.<br/>
              <a href="https://fragx.app/profile" style="color:#22d3ee;text-decoration:none;">Manage your watches</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { events }: NotifyPayload = await req.json();
    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ message: 'No events' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let totalSent = 0;
    const errors: string[] = [];

    for (const event of events) {
      const { data: watches } = await supabaseAdmin
        .from('product_watches')
        .select('id, user_id, notify_sold_out, notify_price_drop, notify_price_increase, notify_via_email, notify_via_sms')
        .eq('vendor_slug', event.vendor_slug)
        .eq('shopify_id', event.shopify_id);

      if (!watches || watches.length === 0) continue;

      const productUrl = buildProductUrl(event.vendor_base_url, event.product_handle);

      for (const watch of watches) {
        const shouldNotify =
          (event.event_type === 'sold_out' && watch.notify_sold_out) ||
          (event.event_type === 'back_in_stock' && watch.notify_sold_out) ||
          (event.event_type === 'price_drop' && watch.notify_price_drop) ||
          (event.event_type === 'price_increase' && watch.notify_price_increase);

        if (!shouldNotify) continue;

        if (watch.notify_via_email && resendApiKey) {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(watch.user_id);
          const email = authUser?.user?.email;
          if (email) {
            const html = buildEmailHtml(event, productUrl, watch);
            const subject =
              event.event_type === 'sold_out' ? `Sold out: ${event.product_title}` :
              event.event_type === 'back_in_stock' ? `Back in stock: ${event.product_title}` :
              event.event_type === 'price_drop' ? `Price drop: ${event.product_title} - $${event.new_price!.toFixed(2)}` :
              `Price increase: ${event.product_title} - $${event.new_price!.toFixed(2)}`;

            const res = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'FragX <notifications@fragx.app>',
                to: email,
                subject,
                html,
              }),
            });
            if (res.ok) totalSent++;
            else errors.push(`Email failed for user ${watch.user_id}: ${await res.text()}`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: totalSent, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
