-- Create subscription_type table
CREATE TABLE public.subscription_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interest_level TEXT,
  job_subscription BOOLEAN DEFAULT false,
  cover_letter_subscription BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create job_sites table
CREATE TABLE public.job_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  status TEXT,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  subscription_id UUID REFERENCES public.subscription_type(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add new fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN jobs_applied INTEGER DEFAULT 0,
ADD COLUMN jobs_sent INTEGER DEFAULT 0,
ADD COLUMN subscriptions UUID REFERENCES public.subscription_type(id),
ADD COLUMN resume_count INTEGER DEFAULT 0,
ADD COLUMN account_active BOOLEAN DEFAULT true,
ADD COLUMN webhook TEXT,
ADD COLUMN next_billing_month TIMESTAMP WITH TIME ZONE,
ADD COLUMN videos_watched INTEGER DEFAULT 0,
ADD COLUMN enhanced_resume_folder TEXT,
ADD COLUMN drive_id TEXT,
ADD COLUMN resume_key TEXT;

-- Add new fields to jobs table
ALTER TABLE public.jobs
ADD COLUMN user_profile_id UUID REFERENCES public.profiles(id),
ADD COLUMN j_uuid UUID DEFAULT gen_random_uuid(),
ADD COLUMN match_rating INTEGER,
ADD COLUMN job_site_id UUID REFERENCES public.job_sites(id),
ADD COLUMN job_link TEXT,
ADD COLUMN company_link TEXT,
ADD COLUMN resume_link TEXT,
ADD COLUMN cover_letter_link TEXT,
ADD COLUMN justification TEXT;

-- Enable RLS on new tables
ALTER TABLE public.subscription_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_type
CREATE POLICY "Users can view subscription types"
ON public.subscription_type FOR SELECT
USING (true);

-- RLS policies for job_sites
CREATE POLICY "Anyone can view job sites"
ON public.job_sites FOR SELECT
USING (true);

-- RLS policies for payments
CREATE POLICY "Users can view own payments"
ON public.payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
ON public.payments FOR INSERT
WITH CHECK (auth.uid() = user_id);