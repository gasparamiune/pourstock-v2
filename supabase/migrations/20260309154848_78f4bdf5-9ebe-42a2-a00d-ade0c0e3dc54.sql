
-- Update unique constraint to include hotel_id
ALTER TABLE public.user_departments DROP CONSTRAINT IF EXISTS user_departments_user_id_department_key;
-- Create new unique constraint with hotel_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_departments_user_hotel_dept_key'
  ) THEN
    ALTER TABLE public.user_departments ADD CONSTRAINT user_departments_user_hotel_dept_key UNIQUE (user_id, hotel_id, department);
  END IF;
END $$;
