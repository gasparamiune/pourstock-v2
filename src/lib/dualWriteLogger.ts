import { supabase } from '@/integrations/supabase/client';

/**
 * Structured dual-write failure logger.
 * Best-effort — logging itself must never crash the UI.
 */
export async function logDualWriteFailure(params: {
  hotelId?: string;
  domain: string;
  operation: string;
  sourceRecordId?: string;
  error: unknown;
  retryable?: boolean;
}): Promise<void> {
  try {
    const errMsg = params.error instanceof Error
      ? params.error.message
      : typeof params.error === 'string'
        ? params.error
        : JSON.stringify(params.error);

    const errCode = params.error && typeof params.error === 'object' && 'code' in params.error
      ? String((params.error as any).code)
      : null;

    await supabase.from('dual_write_failures').insert({
      hotel_id: params.hotelId || null,
      domain: params.domain,
      operation: params.operation,
      source_record_id: params.sourceRecordId || null,
      error_message: errMsg?.substring(0, 1000),
      error_code: errCode,
      retryable: params.retryable ?? true,
    } as any);
  } catch {
    // Failure logging itself must never throw
  }
}
