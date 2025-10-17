-- Remove company_id foreign key column from jobs table
ALTER TABLE public.jobs DROP COLUMN company_id;

-- Add company_name text field
ALTER TABLE public.jobs ADD COLUMN company_name TEXT;