-- Create billing table for tracking subscription billing history
CREATE TABLE IF NOT EXISTS public.billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  amount NUMERIC(10, 2) NOT NULL,
  subscription_type_id UUID REFERENCES public.subscription_type(id),
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on billing table
ALTER TABLE public.billing ENABLE ROW LEVEL SECURITY;

-- Users can view their own billing history
CREATE POLICY "Users can view own billing history"
ON public.billing
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

-- Allow system to insert billing records
CREATE POLICY "System can insert billing records"
ON public.billing
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

-- Create index for faster queries
CREATE INDEX idx_billing_profile_id ON public.billing(profile_id);
CREATE INDEX idx_billing_transaction_date ON public.billing(transaction_date DESC);