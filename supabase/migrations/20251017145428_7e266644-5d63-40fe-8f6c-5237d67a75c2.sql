-- Add job_titles array column to profiles table (max 3 titles)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS job_titles TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add a constraint to limit max 3 job titles
ALTER TABLE public.profiles
ADD CONSTRAINT max_three_job_titles CHECK (array_length(job_titles, 1) IS NULL OR array_length(job_titles, 1) <= 3);