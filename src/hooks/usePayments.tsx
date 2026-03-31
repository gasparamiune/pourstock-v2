import { useState, useCallback, useRef } from 'react';
import { loadStripeTerminal } from '@stripe/terminal-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export type PaymentStatus =
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'creating_intent'
  | 'waiting_for_card'
  | 'processing'
  | 'succeeded'
  | 'failed';

export interface Payment {
  id: string;
  hotel_id: string;
  order_id: string;
  amount: number;
  currency: string;
  stripe_payment_intent_id: string | null;
  stripe_reader_id: string | null;
  status: string;
  split_index: number | null;
  split_total: number | null;
  paid_at: string | null;
  created_at: string;
}

async function callStripeTerminalFn(action: string, payload: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await supabase.functions.invoke('stripe-terminal', {
    body: { action, ...payload },
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
  });
  if (res.error) throw new Error(res.error.message);
  return res.data as Record<string, unknown>;
}

export function useOrderPayments(orderId: string) {
  const { activeHotelId } = useAuth();
  return useQuery({
    queryKey: ['payments', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments' as any)
        .select('*')
        .eq('order_id', orderId)
        .order('created_at');
      if (error) throw error;
      return (data as unknown) as Payment[];
    },
    enabled: !!orderId && !!activeHotelId,
  });
}

export function useStripeTerminal() {
  const { activeHotelId } = useAuth();
  const qc = useQueryClient();
  const terminalRef = useRef<any>(null);
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const { data: hotel } = useQuery({
    queryKey: ['hotel-stripe', activeHotelId],
    queryFn: async () => {
      const { data } = await supabase
        .from('hotels' as any)
        .select('stripe_account_id, stripe_connect_completed, stripe_default_reader_id')
        .eq('id', activeHotelId)
        .single();
      return (data as unknown) as { stripe_account_id: string | null; stripe_connect_completed: boolean; stripe_default_reader_id: string | null } | null;
    },
    enabled: !!activeHotelId,
  });

  const initTerminal = useCallback(async () => {
    if (terminalRef.current) return terminalRef.current;
    setStatus('connecting');
    setError(null);
    try {
      const StripeTerminal = await loadStripeTerminal();
      const terminal = StripeTerminal.create({
        onFetchConnectionToken: async () => {
          const result = await callStripeTerminalFn('connection-token', {
            stripe_account_id: hotel?.stripe_account_id ?? undefined,
          });
          return result.secret as string;
        },
        onUnexpectedReaderDisconnect: () => {
          setError('Reader disconnected unexpectedly');
          setStatus('failed');
        },
      });
      terminalRef.current = terminal;
      setStatus('ready');
      return terminal;
    } catch (e) {
      setError((e as Error).message);
      setStatus('failed');
      throw e;
    }
  }, [hotel?.stripe_account_id]);

  const collectAndPay = useCallback(async ({
    orderId,
    amountDkk,
    splitIndex = null,
    splitTotal = null,
    readerId,
  }: {
    orderId: string;
    amountDkk: number;
    splitIndex?: number | null;
    splitTotal?: number | null;
    readerId?: string;
  }) => {
    setError(null);

    try {
      const terminal = await initTerminal();

      const resolvedReaderId = readerId ?? hotel?.stripe_default_reader_id;
      if (!resolvedReaderId) throw new Error('No reader configured. Set a default reader in Settings.');

      setStatus('connecting');
      const connectResult = await (terminal.connectReader(
        { id: resolvedReaderId },
        { fail_if_in_use: false },
      ) as any);
      if (connectResult.error) throw new Error(connectResult.error.message);

      setStatus('creating_intent');
      const intentResult = await callStripeTerminalFn('create-payment-intent', {
        amount_dkk: amountDkk,
        order_id: orderId,
        stripe_account_id: hotel?.stripe_account_id ?? undefined,
      });
      const clientSecret = intentResult.client_secret as string;
      const paymentIntentId = intentResult.payment_intent_id as string;

      const { data: paymentRow, error: insertErr } = await supabase
        .from('payments' as any)
        .insert({
          hotel_id: activeHotelId,
          order_id: orderId,
          amount: amountDkk,
          currency: 'dkk',
          stripe_payment_intent_id: paymentIntentId,
          stripe_reader_id: resolvedReaderId,
          status: 'pending',
          split_index: splitIndex,
          split_total: splitTotal,
        })
        .select('id')
        .single();
      if (insertErr) throw insertErr;
      const paymentId = (paymentRow as unknown as { id: string }).id;

      setStatus('waiting_for_card');
      const collectResult = await (terminal.collectPaymentMethod(clientSecret) as any);
      if (collectResult.error) throw new Error(collectResult.error.message);

      setStatus('processing');
      const processResult = await (terminal.processPayment(collectResult.paymentIntent) as any);
      if (processResult.error) throw new Error(processResult.error.message);

      await callStripeTerminalFn('capture', {
        payment_intent_id: paymentIntentId,
        stripe_account_id: hotel?.stripe_account_id ?? undefined,
      });

      await supabase
        .from('payments' as any)
        .update({ status: 'succeeded', paid_at: new Date().toISOString() })
        .eq('id', paymentId);

      await supabase.from('audit_logs' as any).insert({
        hotel_id: activeHotelId,
        action: 'paid',
        entity_type: 'payment',
        entity_id: paymentId,
        metadata: { order_id: orderId, amount: amountDkk, split_index: splitIndex, split_total: splitTotal },
      });

      qc.invalidateQueries({ queryKey: ['payments', orderId] });
      qc.invalidateQueries({ queryKey: ['table-orders'] });
      setStatus('succeeded');
      toast.success('Payment successful!');
      return { paymentId };
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      setStatus('failed');
      toast.error(`Payment failed: ${msg}`);
      throw e;
    }
  }, [activeHotelId, hotel, initTerminal]);

  function reset() {
    setStatus('idle');
    setError(null);
  }

  return { status, error, hotel, collectAndPay, reset };
}
