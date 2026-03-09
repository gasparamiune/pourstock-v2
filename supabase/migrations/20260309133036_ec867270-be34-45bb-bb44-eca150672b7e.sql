-- =============================================
-- PHASE 2A: Rewrite ALL RLS policies for tenant isolation
-- Drop existing policies and replace with hotel-scoped versions
-- =============================================

-- Helper: hotel-scoped department check
CREATE OR REPLACE FUNCTION public.has_hotel_department(_user_id uuid, _hotel_id uuid, _department department)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_departments
    WHERE user_id = _user_id AND department = _department
  ) AND public.is_hotel_member(_user_id, _hotel_id)
$$;

CREATE OR REPLACE FUNCTION public.is_hotel_dept_manager(_user_id uuid, _hotel_id uuid, _department department)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_departments
    WHERE user_id = _user_id AND department = _department AND department_role = 'manager'
  ) AND public.is_hotel_member(_user_id, _hotel_id)
$$;

CREATE OR REPLACE FUNCTION public.is_hotel_admin_or_manager(_user_id uuid, _hotel_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hotel_members
    WHERE user_id = _user_id AND hotel_id = _hotel_id AND hotel_role IN ('hotel_admin', 'manager') AND is_approved = true
  )
$$;

-- ============ PRODUCTS ============
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
DROP POLICY IF EXISTS "Managers and admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Managers and admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

CREATE POLICY "Members can view products" ON public.products
  FOR SELECT USING (is_hotel_member(auth.uid(), hotel_id));
CREATE POLICY "Managers can insert products" ON public.products
  FOR INSERT WITH CHECK (is_hotel_admin_or_manager(auth.uid(), hotel_id));
CREATE POLICY "Managers can update products" ON public.products
  FOR UPDATE USING (is_hotel_admin_or_manager(auth.uid(), hotel_id));
CREATE POLICY "Hotel admins can delete products" ON public.products
  FOR DELETE USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'));

-- ============ LOCATIONS ============
DROP POLICY IF EXISTS "Authenticated users can view locations" ON public.locations;
DROP POLICY IF EXISTS "Managers and admins can manage locations" ON public.locations;

CREATE POLICY "Members can view locations" ON public.locations
  FOR SELECT USING (is_hotel_member(auth.uid(), hotel_id));
CREATE POLICY "Managers can manage locations" ON public.locations
  FOR ALL USING (is_hotel_admin_or_manager(auth.uid(), hotel_id));

-- ============ STOCK_LEVELS ============
DROP POLICY IF EXISTS "Authenticated users can view stock levels" ON public.stock_levels;
DROP POLICY IF EXISTS "Managers and admins can update stock levels" ON public.stock_levels;
DROP POLICY IF EXISTS "Managers can manage stock levels" ON public.stock_levels;

CREATE POLICY "Members can view stock levels" ON public.stock_levels
  FOR SELECT USING (is_hotel_member(auth.uid(), hotel_id));
CREATE POLICY "Managers can manage stock levels" ON public.stock_levels
  FOR ALL USING (is_hotel_admin_or_manager(auth.uid(), hotel_id));

-- ============ STOCK_MOVEMENTS ============
DROP POLICY IF EXISTS "Admins can manage movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Authenticated users can create movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Managers and admins can view movements" ON public.stock_movements;

CREATE POLICY "Members can insert movements" ON public.stock_movements
  FOR INSERT WITH CHECK (is_hotel_member(auth.uid(), hotel_id) AND auth.uid() = user_id);
CREATE POLICY "Managers can view movements" ON public.stock_movements
  FOR SELECT USING (is_hotel_admin_or_manager(auth.uid(), hotel_id));
CREATE POLICY "Hotel admins can manage movements" ON public.stock_movements
  FOR ALL USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'));

-- ============ PURCHASE_ORDERS ============
DROP POLICY IF EXISTS "Admins can delete orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Managers and admins can view orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Managers can create orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Managers can update orders" ON public.purchase_orders;

CREATE POLICY "Managers can view orders" ON public.purchase_orders
  FOR SELECT USING (is_hotel_admin_or_manager(auth.uid(), hotel_id));
CREATE POLICY "Managers can create orders" ON public.purchase_orders
  FOR INSERT WITH CHECK (is_hotel_admin_or_manager(auth.uid(), hotel_id));
CREATE POLICY "Managers can update orders" ON public.purchase_orders
  FOR UPDATE USING (is_hotel_admin_or_manager(auth.uid(), hotel_id));
CREATE POLICY "Hotel admins can delete orders" ON public.purchase_orders
  FOR DELETE USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'));

-- ============ PURCHASE_ORDER_ITEMS ============
DROP POLICY IF EXISTS "Managers and admins can view order items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Managers can manage order items" ON public.purchase_order_items;

CREATE POLICY "Managers can view order items" ON public.purchase_order_items
  FOR SELECT USING (is_hotel_admin_or_manager(auth.uid(), hotel_id));
CREATE POLICY "Managers can manage order items" ON public.purchase_order_items
  FOR ALL USING (is_hotel_admin_or_manager(auth.uid(), hotel_id));

-- ============ TABLE_PLANS ============
DROP POLICY IF EXISTS "Admins can delete table plans" ON public.table_plans;
DROP POLICY IF EXISTS "Authenticated users can create table plans" ON public.table_plans;
DROP POLICY IF EXISTS "Authenticated users can update table plans" ON public.table_plans;
DROP POLICY IF EXISTS "Authenticated users can view table plans" ON public.table_plans;
DROP POLICY IF EXISTS "Users can delete their own plans" ON public.table_plans;

CREATE POLICY "Members can view table plans" ON public.table_plans
  FOR SELECT USING (is_hotel_member(auth.uid(), hotel_id));
CREATE POLICY "Members can create table plans" ON public.table_plans
  FOR INSERT WITH CHECK (is_hotel_member(auth.uid(), hotel_id));
CREATE POLICY "Members can update table plans" ON public.table_plans
  FOR UPDATE USING (is_hotel_member(auth.uid(), hotel_id));
CREATE POLICY "Hotel admins can delete table plans" ON public.table_plans
  FOR DELETE USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR auth.uid() = created_by);

-- ============ TABLE_PLAN_CHANGES ============
DROP POLICY IF EXISTS "Admin can delete changes" ON public.table_plan_changes;
DROP POLICY IF EXISTS "Reception can insert changes" ON public.table_plan_changes;
DROP POLICY IF EXISTS "Restaurant and admin can view changes" ON public.table_plan_changes;
DROP POLICY IF EXISTS "Restaurant can update changes" ON public.table_plan_changes;

CREATE POLICY "Members can view changes" ON public.table_plan_changes
  FOR SELECT USING (
    is_hotel_member(auth.uid(), hotel_id) AND (
      has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
      has_hotel_department(auth.uid(), hotel_id, 'restaurant') OR
      has_hotel_department(auth.uid(), hotel_id, 'reception')
    )
  );
CREATE POLICY "Reception/restaurant can insert changes" ON public.table_plan_changes
  FOR INSERT WITH CHECK (
    is_hotel_member(auth.uid(), hotel_id) AND (
      has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
      has_hotel_department(auth.uid(), hotel_id, 'reception') OR
      has_hotel_department(auth.uid(), hotel_id, 'restaurant')
    )
  );
CREATE POLICY "Restaurant can update changes" ON public.table_plan_changes
  FOR UPDATE USING (
    is_hotel_member(auth.uid(), hotel_id) AND (
      has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
      has_hotel_department(auth.uid(), hotel_id, 'restaurant')
    )
  );
CREATE POLICY "Hotel admins can delete changes" ON public.table_plan_changes
  FOR DELETE USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'));

-- ============ ROOMS ============
DROP POLICY IF EXISTS "Authenticated users can view rooms" ON public.rooms;
DROP POLICY IF EXISTS "Reception managers or admins can delete rooms" ON public.rooms;
DROP POLICY IF EXISTS "Reception managers or admins can insert rooms" ON public.rooms;
DROP POLICY IF EXISTS "Reception or HK can update rooms" ON public.rooms;

CREATE POLICY "Members can view rooms" ON public.rooms
  FOR SELECT USING (is_hotel_member(auth.uid(), hotel_id));
CREATE POLICY "Reception managers can insert rooms" ON public.rooms
  FOR INSERT WITH CHECK (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    is_hotel_dept_manager(auth.uid(), hotel_id, 'reception')
  );
CREATE POLICY "Reception/HK can update rooms" ON public.rooms
  FOR UPDATE USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'reception') OR
    has_hotel_department(auth.uid(), hotel_id, 'housekeeping')
  );
CREATE POLICY "Reception managers can delete rooms" ON public.rooms
  FOR DELETE USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    is_hotel_dept_manager(auth.uid(), hotel_id, 'reception')
  );

-- ============ GUESTS ============
DROP POLICY IF EXISTS "Reception can insert guests" ON public.guests;
DROP POLICY IF EXISTS "Reception can update guests" ON public.guests;
DROP POLICY IF EXISTS "Reception can view guests" ON public.guests;
DROP POLICY IF EXISTS "Reception managers can delete guests" ON public.guests;

CREATE POLICY "Reception can view guests" ON public.guests
  FOR SELECT USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'reception')
  );
CREATE POLICY "Reception can insert guests" ON public.guests
  FOR INSERT WITH CHECK (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'reception')
  );
CREATE POLICY "Reception can update guests" ON public.guests
  FOR UPDATE USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'reception')
  );
CREATE POLICY "Reception managers can delete guests" ON public.guests
  FOR DELETE USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    is_hotel_dept_manager(auth.uid(), hotel_id, 'reception')
  );

-- ============ RESERVATIONS ============
DROP POLICY IF EXISTS "Reception can insert reservations" ON public.reservations;
DROP POLICY IF EXISTS "Reception can update reservations" ON public.reservations;
DROP POLICY IF EXISTS "Reception can view reservations" ON public.reservations;
DROP POLICY IF EXISTS "Reception managers can delete reservations" ON public.reservations;

CREATE POLICY "Reception can view reservations" ON public.reservations
  FOR SELECT USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'reception')
  );
CREATE POLICY "Reception can insert reservations" ON public.reservations
  FOR INSERT WITH CHECK (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'reception')
  );
CREATE POLICY "Reception can update reservations" ON public.reservations
  FOR UPDATE USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'reception')
  );
CREATE POLICY "Reception managers can delete reservations" ON public.reservations
  FOR DELETE USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    is_hotel_dept_manager(auth.uid(), hotel_id, 'reception')
  );

-- ============ ROOM_CHARGES ============
DROP POLICY IF EXISTS "Reception can insert charges" ON public.room_charges;
DROP POLICY IF EXISTS "Reception can update charges" ON public.room_charges;
DROP POLICY IF EXISTS "Reception can view charges" ON public.room_charges;
DROP POLICY IF EXISTS "Reception managers can delete charges" ON public.room_charges;

CREATE POLICY "Reception can view charges" ON public.room_charges
  FOR SELECT USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'reception')
  );
CREATE POLICY "Reception can insert charges" ON public.room_charges
  FOR INSERT WITH CHECK (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'reception')
  );
CREATE POLICY "Reception can update charges" ON public.room_charges
  FOR UPDATE USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'reception')
  );
CREATE POLICY "Reception managers can delete charges" ON public.room_charges
  FOR DELETE USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    is_hotel_dept_manager(auth.uid(), hotel_id, 'reception')
  );

-- ============ HOUSEKEEPING_TASKS ============
DROP POLICY IF EXISTS "HK and reception can view tasks" ON public.housekeeping_tasks;
DROP POLICY IF EXISTS "HK can insert tasks" ON public.housekeeping_tasks;
DROP POLICY IF EXISTS "HK managers can delete tasks" ON public.housekeeping_tasks;
DROP POLICY IF EXISTS "HK members can update own or managers all" ON public.housekeeping_tasks;

CREATE POLICY "HK/reception can view tasks" ON public.housekeeping_tasks
  FOR SELECT USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'housekeeping') OR
    has_hotel_department(auth.uid(), hotel_id, 'reception')
  );
CREATE POLICY "HK/reception can insert tasks" ON public.housekeeping_tasks
  FOR INSERT WITH CHECK (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'housekeeping') OR
    has_hotel_department(auth.uid(), hotel_id, 'reception')
  );
CREATE POLICY "HK can update tasks" ON public.housekeeping_tasks
  FOR UPDATE USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    is_hotel_dept_manager(auth.uid(), hotel_id, 'housekeeping') OR
    (has_hotel_department(auth.uid(), hotel_id, 'housekeeping') AND assigned_to = auth.uid())
  );
CREATE POLICY "HK managers can delete tasks" ON public.housekeeping_tasks
  FOR DELETE USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    is_hotel_dept_manager(auth.uid(), hotel_id, 'housekeeping')
  );

-- ============ HOUSEKEEPING_LOGS ============
DROP POLICY IF EXISTS "HK can insert logs" ON public.housekeeping_logs;
DROP POLICY IF EXISTS "HK can view logs" ON public.housekeeping_logs;

CREATE POLICY "HK can view logs" ON public.housekeeping_logs
  FOR SELECT USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'housekeeping')
  );
CREATE POLICY "HK can insert logs" ON public.housekeeping_logs
  FOR INSERT WITH CHECK (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'housekeeping')
  );

-- ============ MAINTENANCE_REQUESTS ============
DROP POLICY IF EXISTS "HK can report maintenance" ON public.maintenance_requests;
DROP POLICY IF EXISTS "HK can view maintenance" ON public.maintenance_requests;
DROP POLICY IF EXISTS "HK managers can delete maintenance" ON public.maintenance_requests;
DROP POLICY IF EXISTS "HK managers can update maintenance" ON public.maintenance_requests;

CREATE POLICY "HK can view maintenance" ON public.maintenance_requests
  FOR SELECT USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'housekeeping')
  );
CREATE POLICY "HK can report maintenance" ON public.maintenance_requests
  FOR INSERT WITH CHECK (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'housekeeping')
  );
CREATE POLICY "HK managers can update maintenance" ON public.maintenance_requests
  FOR UPDATE USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    is_hotel_dept_manager(auth.uid(), hotel_id, 'housekeeping')
  );
CREATE POLICY "HK managers can delete maintenance" ON public.maintenance_requests
  FOR DELETE USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    is_hotel_dept_manager(auth.uid(), hotel_id, 'housekeeping')
  );