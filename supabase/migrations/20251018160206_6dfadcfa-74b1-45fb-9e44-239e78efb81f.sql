-- Drop policies that depend on the function
DROP POLICY IF EXISTS "Allow inserts with valid profile uuid" ON public.jobs;
DROP POLICY IF EXISTS "Allow updates with valid profile uuid" ON public.jobs;
DROP POLICY IF EXISTS "Allow deletes with valid profile uuid" ON public.jobs;

-- Drop and recreate the function with better short UUID handling
DROP FUNCTION IF EXISTS public.is_valid_profile_uuid(text);

CREATE OR REPLACE FUNCTION public.is_valid_profile_uuid(_uuid text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Check if the UUID exists in profiles table
  -- The profiles.uuid column stores short format UUIDs (10 alphanumeric characters)
  -- We trim and convert to lowercase for case-insensitive matching
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE LOWER(TRIM(uuid)) = LOWER(TRIM(_uuid))
  );
$$;

-- Recreate the RLS policies for anon role
CREATE POLICY "Allow inserts with valid profile uuid"
ON public.jobs
FOR INSERT
TO anon
WITH CHECK (public.is_valid_profile_uuid((uuid)::text));

CREATE POLICY "Allow updates with valid profile uuid"
ON public.jobs
FOR UPDATE
TO anon
USING (public.is_valid_profile_uuid((uuid)::text))
WITH CHECK (public.is_valid_profile_uuid((uuid)::text));

CREATE POLICY "Allow deletes with valid profile uuid"
ON public.jobs
FOR DELETE
TO anon
USING (public.is_valid_profile_uuid((uuid)::text));