-- First, update all existing j_uuid values to proper UUIDs
UPDATE public.jobs SET j_uuid = gen_random_uuid()::text WHERE j_uuid IS NOT NULL;

-- Then change the column type to uuid
ALTER TABLE public.jobs 
ALTER COLUMN j_uuid TYPE uuid 
USING CASE 
  WHEN j_uuid ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
  THEN j_uuid::uuid 
  ELSE gen_random_uuid() 
END;