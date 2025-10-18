-- Remove resume_url column from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS resume_url;