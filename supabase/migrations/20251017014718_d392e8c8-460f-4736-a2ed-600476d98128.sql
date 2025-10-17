-- Add uuid field to profiles table with max length of 10
ALTER TABLE public.profiles
ADD COLUMN uuid VARCHAR(10);