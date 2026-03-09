-- Set hotel_id to NOT NULL on all business tables (data already backfilled)
ALTER TABLE public.products ALTER COLUMN hotel_id SET NOT NULL;
ALTER TABLE public.locations ALTER COLUMN hotel_id SET NOT NULL;
ALTER TABLE public.stock_levels ALTER COLUMN hotel_id SET NOT NULL;
ALTER TABLE public.stock_movements ALTER COLUMN hotel_id SET NOT NULL;
ALTER TABLE public.purchase_orders ALTER COLUMN hotel_id SET NOT NULL;
ALTER TABLE public.purchase_order_items ALTER COLUMN hotel_id SET NOT NULL;
ALTER TABLE public.table_plans ALTER COLUMN hotel_id SET NOT NULL;
ALTER TABLE public.table_plan_changes ALTER COLUMN hotel_id SET NOT NULL;
ALTER TABLE public.rooms ALTER COLUMN hotel_id SET NOT NULL;
ALTER TABLE public.guests ALTER COLUMN hotel_id SET NOT NULL;
ALTER TABLE public.reservations ALTER COLUMN hotel_id SET NOT NULL;
ALTER TABLE public.room_charges ALTER COLUMN hotel_id SET NOT NULL;
ALTER TABLE public.housekeeping_tasks ALTER COLUMN hotel_id SET NOT NULL;
ALTER TABLE public.housekeeping_logs ALTER COLUMN hotel_id SET NOT NULL;
ALTER TABLE public.maintenance_requests ALTER COLUMN hotel_id SET NOT NULL;