-- Update the handle_new_user function to generate a UUID
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  high_tier_id UUID;
  new_subscription_id UUID;
  user_uuid TEXT;
BEGIN
  -- Generate a unique 10-character UUID for S3 folder structure
  user_uuid := SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 10);

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

  -- Insert profile with subscription reference and UUID
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
$function$;