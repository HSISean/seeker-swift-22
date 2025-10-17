-- Remove salary_min and salary_max columns from jobs table
ALTER TABLE public.jobs DROP COLUMN salary_min;
ALTER TABLE public.jobs DROP COLUMN salary_max;

-- Add salary description field
ALTER TABLE public.jobs ADD COLUMN salary TEXT;