-- Fix critical security issues

-- 1. Fix profiles table RLS policy - restrict to owner-only access
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 2. Normalize SECURITY DEFINER functions to use consistent search_path syntax
CREATE OR REPLACE FUNCTION public.get_user_uuid(_user_id uuid)
RETURNS character varying
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT uuid 
  FROM public.profiles 
  WHERE id = _user_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_valid_profile_uuid(_uuid text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE LOWER(TRIM(uuid)) = LOWER(TRIM(_uuid))
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  high_tier_id UUID;
  new_subscription_id UUID;
  user_uuid TEXT;
BEGIN
  user_uuid := SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 10);

  SELECT id INTO high_tier_id
  FROM public.subscription_type
  WHERE interest_level = 'need_a_job_asap'
    AND cover_letter_subscription = '2.99'
    AND job_subscription = '29.99'
    AND resume_subscription = '5.99'
  LIMIT 1;

  INSERT INTO public.subscriptions (user_id, subscription_type_id, is_trial)
  VALUES (NEW.id, high_tier_id, true)
  RETURNING id INTO new_subscription_id;

  INSERT INTO public.profiles (id, email, full_name, subscriptions, uuid)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    new_subscription_id,
    user_uuid
  );
  
  RETURN NEW;
END;
$$;