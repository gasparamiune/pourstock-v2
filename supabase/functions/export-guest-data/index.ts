import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify caller is authenticated
    const { data: { user }, error: authErr } = await createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    ).auth.getUser();

    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { guestId } = await req.json();
    if (!guestId) {
      return new Response(JSON.stringify({ error: 'guestId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch guest record
    const { data: guest, error: guestErr } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single();

    if (guestErr || !guest) {
      return new Response(JSON.stringify({ error: 'Guest not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch reservations
    const { data: reservations } = await supabase
      .from('reservations')
      .select('id, check_in_date, check_out_date, status, rate_per_night, created_at, notes')
      .eq('guest_id', guestId);

    const reservationIds = (reservations ?? []).map((r: any) => r.id);

    // Fetch room charges
    let charges: any[] = [];
    if (reservationIds.length > 0) {
      const { data } = await supabase
        .from('room_charges')
        .select('description, amount, charge_type, created_at')
        .in('reservation_id', reservationIds);
      charges = data ?? [];
    }

    // Fetch GDPR consents if table exists
    let consents: any[] = [];
    try {
      const { data } = await supabase
        .from('gdpr_consents')
        .select('consent_type, granted, created_at')
        .eq('guest_id', guestId);
      consents = data ?? [];
    } catch {
      // Table may not exist yet
    }

    const payload = {
      export_date: new Date().toISOString(),
      export_requested_by: user.email,
      subject: {
        id: guest.id,
        first_name: guest.first_name,
        last_name: guest.last_name,
        email: guest.email,
        phone: guest.phone,
        nationality: guest.nationality,
        passport_number: guest.passport_number,
        created_at: guest.created_at,
      },
      reservations: reservations ?? [],
      charges,
      consents,
    };

    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="guest-data-${guestId}.json"`,
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
