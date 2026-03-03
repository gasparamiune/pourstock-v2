-- Seed 95 rooms across 3 floors
-- Floor 1: rooms 101-132 (32 rooms)
-- Floor 2: rooms 201-233 (33 rooms)
-- Floor 3: rooms 301-332 (32 rooms) -- total = 97, but user said 95. We'll match exact ranges given.

INSERT INTO public.rooms (room_number, floor, room_type, status, capacity, is_active)
SELECT 
  num::text,
  (num / 100)::int as floor,
  CASE 
    WHEN num % 10 IN (1, 2) THEN 'single'::room_type
    WHEN num % 10 IN (3, 4, 5, 6) THEN 'double'::room_type
    WHEN num % 10 IN (7, 8) THEN 'twin'::room_type
    WHEN num % 10 = 9 THEN 'family'::room_type
    WHEN num % 10 = 0 THEN 'suite'::room_type
    ELSE 'double'::room_type
  END,
  'available'::room_status,
  CASE 
    WHEN num % 10 IN (1, 2) THEN 1
    WHEN num % 10 IN (3, 4, 5, 6) THEN 2
    WHEN num % 10 IN (7, 8) THEN 2
    WHEN num % 10 = 9 THEN 4
    WHEN num % 10 = 0 THEN 2
    ELSE 2
  END,
  true
FROM generate_series(101, 132) AS num
UNION ALL
SELECT 
  num::text, 2,
  CASE WHEN num % 10 IN (1,2) THEN 'single'::room_type WHEN num % 10 IN (3,4,5,6) THEN 'double'::room_type WHEN num % 10 IN (7,8) THEN 'twin'::room_type WHEN num % 10 = 9 THEN 'family'::room_type WHEN num % 10 = 0 THEN 'suite'::room_type ELSE 'double'::room_type END,
  'available'::room_status,
  CASE WHEN num % 10 IN (1,2) THEN 1 WHEN num % 10 IN (7,8) THEN 2 WHEN num % 10 = 9 THEN 4 WHEN num % 10 = 0 THEN 2 ELSE 2 END,
  true
FROM generate_series(201, 233) AS num
UNION ALL
SELECT 
  num::text, 3,
  CASE WHEN num % 10 IN (1,2) THEN 'single'::room_type WHEN num % 10 IN (3,4,5,6) THEN 'double'::room_type WHEN num % 10 IN (7,8) THEN 'twin'::room_type WHEN num % 10 = 9 THEN 'family'::room_type WHEN num % 10 = 0 THEN 'suite'::room_type ELSE 'double'::room_type END,
  'available'::room_status,
  CASE WHEN num % 10 IN (1,2) THEN 1 WHEN num % 10 IN (7,8) THEN 2 WHEN num % 10 = 9 THEN 4 WHEN num % 10 = 0 THEN 2 ELSE 2 END,
  true
FROM generate_series(301, 332) AS num
ON CONFLICT DO NOTHING;