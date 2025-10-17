-- Drop existing enum types if they exist
DROP TYPE IF EXISTS public.interest_level_enum CASCADE;
DROP TYPE IF EXISTS public.resume_subscription_enum CASCADE;
DROP TYPE IF EXISTS public.job_subscription_enum CASCADE;
DROP TYPE IF EXISTS public.cover_letter_subscription_enum CASCADE;

-- Create enum for interest_level
CREATE TYPE public.interest_level_enum AS ENUM (
  'browsing',
  'actively_looking',
  'on_the_hunt',
  'need_a_job_asap'
);

-- Create enum for resume_subscription
CREATE TYPE public.resume_subscription_enum AS ENUM (
  '0.00',
  '2.99',
  '3.99',
  '5.99'
);

-- Create enum for job_subscription
CREATE TYPE public.job_subscription_enum AS ENUM (
  '0.00',
  '6.99',
  '15.99',
  '29.99'
);

-- Create enum for cover_letter_subscription
CREATE TYPE public.cover_letter_subscription_enum AS ENUM (
  '0.00',
  '2.99'
);

-- Add all columns with enum types to subscription_type table
ALTER TABLE public.subscription_type
ADD COLUMN IF NOT EXISTS interest_level public.interest_level_enum,
ADD COLUMN IF NOT EXISTS resume_subscription public.resume_subscription_enum,
ADD COLUMN IF NOT EXISTS job_subscription public.job_subscription_enum,
ADD COLUMN IF NOT EXISTS cover_letter_subscription public.cover_letter_subscription_enum;