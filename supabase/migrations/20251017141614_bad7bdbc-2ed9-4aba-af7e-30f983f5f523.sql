-- Add company_logo_url to jobs table
ALTER TABLE public.jobs ADD COLUMN company_logo_url TEXT;

-- Add resume_downloads_count to profiles table to track monthly downloads
ALTER TABLE public.profiles ADD COLUMN resume_downloads_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN resume_downloads_reset_at TIMESTAMP WITH TIME ZONE DEFAULT date_trunc('month', NOW()) + INTERVAL '1 month';