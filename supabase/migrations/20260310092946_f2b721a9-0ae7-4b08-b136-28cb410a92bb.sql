-- Phase 6: Add vendor_id (uuid FK) and category_id (uuid FK) to products
-- Both nullable to support gradual adoption. Legacy fields remain.
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES public.vendors(id),
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.product_categories(id);

-- Add index for FK lookups
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON public.products(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id) WHERE category_id IS NOT NULL;

-- purchase_orders already has vendor_id as text. Add vendor_ref_id as uuid FK.
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS vendor_ref_id uuid REFERENCES public.vendors(id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor_ref_id ON public.purchase_orders(vendor_ref_id) WHERE vendor_ref_id IS NOT NULL;