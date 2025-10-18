-- Create security definer function to validate UUID exists in profiles
-- This allows anon requests to insert/update jobs with valid UUIDs
CREATE OR REPLACE FUNCTION public.is_valid_profile_uuid(_uuid text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE uuid = _uuid
  );
$$;

-- Drop the overly permissive anon policies
DROP POLICY IF EXISTS "Allow anon inserts for automation" ON public.jobs;
DROP POLICY IF EXISTS "Allow anon updates for automation" ON public.jobs;
DROP POLICY IF EXISTS "Allow anon deletes for automation" ON public.jobs;

-- Create new policies that validate the UUID against profiles table
CREATE POLICY "Allow inserts with valid profile uuid"
ON public.jobs
FOR INSERT
TO anon, authenticated
WITH CHECK (public.is_valid_profile_uuid((uuid)::text));

CREATE POLICY "Allow updates with valid profile uuid"
ON public.jobs
FOR UPDATE
TO anon, authenticated
USING (public.is_valid_profile_uuid((uuid)::text))
WITH CHECK (public.is_valid_profile_uuid((uuid)::text));

CREATE POLICY "Allow deletes with valid profile uuid"
ON public.jobs
FOR DELETE
TO anon, authenticated
USING (public.is_valid_profile_uuid((uuid)::text));