import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationPayload {
  listing_id: string;
  poster_user_id: string;
  coral_type: string;
  notes: string;
  asking_price: number | null;
  image_url: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();
    const { listing_id, poster_user_id, coral_type, notes, asking_price, image_url } = payload;

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: posterProfile } = await supabaseAdmin
      .from('profiles')
      .select('username, display_name, location_state')
      .eq('id', poster_user_id)
      .maybeSingle();

    const { data: subscribers } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('notify_new_listings', true)
      .neq('id', poster_user_id);

    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ message: 'No subscribers' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailResults = await Promise.all(
      subscribers.map(async (s) => {
        const { data } = await supabaseAdmin.auth.admin.getUserById(s.id);
        return data?.user?.email ?? null;
      }),
    );
    const emails = emailResults.filter((e): e is string => e !== null);

    if (emails.length === 0) {
      return new Response(JSON.stringify({ message: 'No subscriber emails found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const posterName = posterProfile?.display_name ?? posterProfile?.username ?? 'A member';
    const listingTitle = [coral_type, notes].filter(Boolean).join(' - ') || 'New coral listing';
    const priceText = asking_price != null ? `$${Number(asking_price).toFixed(2)}` : 'Trade only';
    const locationText = posterProfile?.location_state ? ` &bull; ${posterProfile.location_state}` : '';
    const imageHtml = image_url
      ? `<img src="${image_url}" alt="Coral listing" style="width:100%;max-width:400px;border-radius:12px;margin:16px 0;" />`
      : '';

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 0;">
    <tr>
      <td align="center">
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
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">New listing in the trade market</p>
                  <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;line-height:1.3;">${listingTitle}</h1>
                </div>
                <div style="padding:20px 24px;">
                  ${imageHtml}
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-bottom:12px;">
                        <span style="display:inline-block;background:#0e4429;color:#4ade80;font-size:13px;font-weight:600;padding:6px 14px;border-radius:999px;border:1px solid #166534;">${priceText}</span>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 4px;font-size:14px;color:#94a3b8;">
                    Posted by <span style="color:#e2e8f0;font-weight:600;">${posterName}</span>${locationText}
                  </p>
                  ${notes ? `<p style="margin:12px 0 0;font-size:14px;color:#cbd5e1;line-height:1.6;">${notes}</p>` : ''}
                  <div style="margin-top:24px;">
                    <a href="https://fragx.app/trades" style="display:inline-block;background:#0891b2;color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:10px;">View Listing</a>
                  </div>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 16px 0;">
              <p style="margin:0;font-size:12px;color:#475569;text-align:center;">
                You're receiving this because you enabled trade market notifications in your FragX profile.<br />
                <a href="https://fragx.app" style="color:#22d3ee;text-decoration:none;">Manage notification settings</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const emailPayload = {
      from: 'FragX <notifications@fragx.app>',
      bcc: emails,
      subject: `New trade listing: ${listingTitle}`,
      html: htmlBody,
    };

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const resendData = await resendRes.json();

    return new Response(
      JSON.stringify({ success: resendRes.ok, listing_id, recipients: emails.length, resend: resendData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
