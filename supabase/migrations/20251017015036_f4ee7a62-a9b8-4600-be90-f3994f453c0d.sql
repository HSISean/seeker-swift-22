-- Add resume_folder column to profiles table
ALTER TABLE public.profiles
ADD COLUMN resume_folder TEXT;