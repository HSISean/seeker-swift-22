-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_type_id UUID REFERENCES public.subscription_type(id),
  trial_ends_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '3 days'),
  is_trial BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own subscription"
ON public.subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
ON public.subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- Create default subscription type with lowest levels (except interest_level)
INSERT INTO public.subscription_type (interest_level, cover_letter_subscription, job_subscription, resume_subscription)
VALUES ('browsing', '0.00', '0.00', '0.00')
ON CONFLICT DO NOTHING;

-- Create high-tier subscription type for trial
INSERT INTO public.subscription_type (interest_level, cover_letter_subscription, job_subscription, resume_subscription)
VALUES ('need_a_job_asap', '2.99', '29.99', '5.99')
ON CONFLICT DO NOTHING;

-- Update the handle_new_user function to create subscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  high_tier_id UUID;
  new_subscription_id UUID;
BEGIN
  -- Get the high-tier subscription type
  SELECT id INTO high_tier_id
  FROM public.subscription_type
  WHERE interest_level = 'need_a_job_asap'
    AND cover_letter_subscription = '2.99'
    AND job_subscription = '29.99'
    AND resume_subscription = '5.99'
  LIMIT 1;

  -- Create subscription with 3-day trial at high tier
  INSERT INTO public.subscriptions (user_id, subscription_type_id, is_trial)
  VALUES (NEW.id, high_tier_id, true)
  RETURNING id INTO new_subscription_id;

  -- Insert profile with subscription reference
  INSERT INTO public.profiles (id, email, full_name, subscriptions)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    new_subscription_id
  );
  
  RETURN NEW;
END;
$$;

-- Add trigger for updating subscriptions updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();