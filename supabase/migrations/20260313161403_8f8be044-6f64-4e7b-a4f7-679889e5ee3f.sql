
-- Add 'paused' to hk_status enum
ALTER TYPE public.hk_status ADD VALUE IF NOT EXISTS 'paused';

-- Add new task types to hk_task_type enum
ALTER TYPE public.hk_task_type ADD VALUE IF NOT EXISTS 'public_area';
ALTER TYPE public.hk_task_type ADD VALUE IF NOT EXISTS 'post_maintenance';
ALTER TYPE public.hk_task_type ADD VALUE IF NOT EXISTS 'linen_delivery';
ALTER TYPE public.hk_task_type ADD VALUE IF NOT EXISTS 'minibar_restock';
ALTER TYPE public.hk_task_type ADD VALUE IF NOT EXISTS 'amenity_setup';
ALTER TYPE public.hk_task_type ADD VALUE IF NOT EXISTS 'vip_setup';
