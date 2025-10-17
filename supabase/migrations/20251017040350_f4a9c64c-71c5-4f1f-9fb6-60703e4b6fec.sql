-- Drop foreign key constraint first
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_job_site_id_fkey;

-- Change job_site_id column type from uuid to text
ALTER TABLE public.jobs ALTER COLUMN job_site_id TYPE TEXT;