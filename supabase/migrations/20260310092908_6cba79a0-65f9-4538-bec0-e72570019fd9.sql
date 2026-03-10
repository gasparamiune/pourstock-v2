-- Phase 5 hardening: unique slug per hotel for config tables (partial indexes on active records only)
CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_hotel_slug ON public.restaurants (hotel_id, slug) WHERE is_active = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_hotel_slug ON public.departments (hotel_id, slug) WHERE is_active = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_categories_hotel_slug ON public.product_categories (hotel_id, slug) WHERE is_active = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_room_types_hotel_slug ON public.room_types (hotel_id, slug) WHERE is_active = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_hotel_name ON public.vendors (hotel_id, name) WHERE is_active = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_hotel_modules_hotel_module ON public.hotel_modules (hotel_id, module);