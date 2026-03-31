import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const body = await req.json();
  const { action } = body;

  try {
    if (action === 'connection-token') {
      const stripeAccountId: string | undefined = body.stripe_account_id || undefined;
      const token = await stripe.terminal.connectionTokens.create(
        {},
        stripeAccountId ? { stripeAccount: stripeAccountId } : undefined,
      );
      return new Response(JSON.stringify({ secret: token.secret }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create-payment-intent') {
      const { amount_dkk, order_id, stripe_account_id } = body;
      const amountOere = Math.round(amount_dkk * 100);

      const intent = await stripe.paymentIntents.create(
        {
          amount: amountOere,
          currency: 'dkk',
          payment_method_types: ['card_present'],
          capture_method: 'manual',
          metadata: { order_id },
        },
        stripe_account_id ? { stripeAccount: stripe_account_id } : undefined,
      );

      return new Response(
        JSON.stringify({ client_secret: intent.client_secret, payment_intent_id: intent.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (action === 'capture') {
      const { payment_intent_id, stripe_account_id } = body;

      await stripe.paymentIntents.capture(
        payment_intent_id,
        undefined,
        stripe_account_id ? { stripeAccount: stripe_account_id } : undefined,
      );

      return new Response(JSON.stringify({ status: 'succeeded' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
