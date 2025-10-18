-- Drop all authenticated policies on jobs table
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.jobs;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.jobs;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.jobs;

-- Drop the policies that were for both anon and authenticated
DROP POLICY IF EXISTS "Allow inserts with valid profile uuid" ON public.jobs;
DROP POLICY IF EXISTS "Allow updates with valid profile uuid" ON public.jobs;
DROP POLICY IF EXISTS "Allow deletes with valid profile uuid" ON public.jobs;

-- Recreate policies for anon only (for n8n automation)
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