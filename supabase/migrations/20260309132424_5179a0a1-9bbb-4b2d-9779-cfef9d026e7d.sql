-- =============================================
-- PHASE 1C: Add hotel_id to all 15 business tables (nullable first)
-- =============================================

-- Add hotel_id column to each business table
ALTER TABLE public.products ADD COLUMN hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE;
ALTER TABLE public.locations ADD COLUMN hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE;
ALTER TABLE public.stock_levels ADD COLUMN hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE;
ALTER TABLE public.stock_movements ADD COLUMN hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE;
ALTER TABLE public.purchase_orders ADD COLUMN hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE;
ALTER TABLE public.purchase_order_items ADD COLUMN hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE;
ALTER TABLE public.table_plans ADD COLUMN hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE;
ALTER TABLE public.table_plan_changes ADD COLUMN hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE;
ALTER TABLE public.rooms ADD COLUMN hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE;
ALTER TABLE public.guests ADD COLUMN hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE;
ALTER TABLE public.reservations ADD COLUMN hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE;
ALTER TABLE public.room_charges ADD COLUMN hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE;
ALTER TABLE public.housekeeping_tasks ADD COLUMN hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE;
ALTER TABLE public.housekeeping_logs ADD COLUMN hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE;
ALTER TABLE public.maintenance_requests ADD COLUMN hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX idx_products_hotel_id ON public.products(hotel_id);
CREATE INDEX idx_locations_hotel_id ON public.locations(hotel_id);
CREATE INDEX idx_stock_levels_hotel_id ON public.stock_levels(hotel_id);
CREATE INDEX idx_stock_movements_hotel_id ON public.stock_movements(hotel_id);
CREATE INDEX idx_purchase_orders_hotel_id ON public.purchase_orders(hotel_id);
CREATE INDEX idx_purchase_order_items_hotel_id ON public.purchase_order_items(hotel_id);
CREATE INDEX idx_table_plans_hotel_id ON public.table_plans(hotel_id);
CREATE INDEX idx_table_plan_changes_hotel_id ON public.table_plan_changes(hotel_id);
CREATE INDEX idx_rooms_hotel_id ON public.rooms(hotel_id);
CREATE INDEX idx_guests_hotel_id ON public.guests(hotel_id);
CREATE INDEX idx_reservations_hotel_id ON public.reservations(hotel_id);
CREATE INDEX idx_room_charges_hotel_id ON public.room_charges(hotel_id);
CREATE INDEX idx_housekeeping_tasks_hotel_id ON public.housekeeping_tasks(hotel_id);
CREATE INDEX idx_housekeeping_logs_hotel_id ON public.housekeeping_logs(hotel_id);
CREATE INDEX idx_maintenance_requests_hotel_id ON public.maintenance_requests(hotel_id);

-- Indexes on hotel_members for fast lookups
CREATE INDEX idx_hotel_members_user_id ON public.hotel_members(user_id);
CREATE INDEX idx_hotel_members_hotel_id ON public.hotel_members(hotel_id);
CREATE INDEX idx_audit_logs_hotel_id ON public.audit_logs(hotel_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);