import Stripe from 'npm:stripe@14';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
  const action = body.action ?? url.searchParams.get('action');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  try {
    if (action === 'authorize-url') {
      const { hotel_id } = body;
      const clientId = Deno.env.get('STRIPE_CONNECT_CLIENT_ID') ?? '';
      const redirectUri = `${Deno.env.get('APP_URL')}/settings?stripe_callback=1`;
      const oauthUrl =
        `https://connect.stripe.com/oauth/authorize?response_type=code` +
        `&client_id=${clientId}` +
        `&scope=read_write` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${hotel_id}`;

      return new Response(JSON.stringify({ url: oauthUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'callback') {
      const { code, state: hotel_id } = body;
      const response = await stripe.oauth.token({ grant_type: 'authorization_code', code });
      const stripeAccountId = response.stripe_user_id;

      await supabase
        .from('hotels')
        .update({ stripe_account_id: stripeAccountId, stripe_connect_completed: true })
        .eq('id', hotel_id);

      return new Response(JSON.stringify({ stripe_account_id: stripeAccountId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'disconnect') {
      const { hotel_id } = body;
      const { data: hotel } = await supabase.from('hotels').select('stripe_account_id').eq('id', hotel_id).single();
      if (hotel?.stripe_account_id) {
        await stripe.oauth.deauthorize({ client_id: Deno.env.get('STRIPE_CONNECT_CLIENT_ID') ?? '', stripe_user_id: hotel.stripe_account_id });
      }
      await supabase.from('hotels').update({ stripe_account_id: null, stripe_connect_completed: false }).eq('id', hotel_id);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
