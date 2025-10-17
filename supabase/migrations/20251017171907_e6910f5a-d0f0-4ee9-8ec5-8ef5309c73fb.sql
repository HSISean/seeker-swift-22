-- Remove employment_type and requirements columns from jobs table
ALTER TABLE public.jobs 
DROP COLUMN IF EXISTS employment_type,
DROP COLUMN IF EXISTS requirements;