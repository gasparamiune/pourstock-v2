-- Add 'bar' to the department enum (safe, idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public.department'::regtype
      AND enumlabel = 'bar'
  ) THEN
    ALTER TYPE public.department ADD VALUE 'bar';
  END IF;
END$$;
