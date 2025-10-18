-- Drop existing restrictive policies on jobs table
DROP POLICY IF EXISTS "Users can view jobs matching their uuid" ON public.jobs;
DROP POLICY IF EXISTS "Allow inserts with valid profile uuid" ON public.jobs;
DROP POLICY IF EXISTS "Allow updates with valid profile uuid" ON public.jobs;
DROP POLICY IF EXISTS "Allow deletes with valid profile uuid" ON public.jobs;

-- Create new policies that allow service role (n8n) full access
-- Service role bypasses RLS, but we're making it explicit

-- Allow service role and matching users to SELECT
CREATE POLICY "Service role and users can view jobs"
ON public.jobs
FOR SELECT
USING (
  is_active = true 
  AND (
    -- Service role can see all
    auth.jwt()->>'role' = 'service_role'
    OR
    -- Users can see their own jobs
    (uuid)::text = (get_user_uuid(auth.uid()))::text
  )
);

-- Allow service role to INSERT (n8n)
CREATE POLICY "Service role can insert jobs"
ON public.jobs
FOR INSERT
WITH CHECK (
  auth.jwt()->>'role' = 'service_role'
  OR
  is_valid_profile_uuid((uuid)::text)
);

-- Allow service role to UPDATE
CREATE POLICY "Service role can update jobs"
ON public.jobs
FOR UPDATE
USING (
  auth.jwt()->>'role' = 'service_role'
  OR
  is_valid_profile_uuid((uuid)::text)
)
WITH CHECK (
  auth.jwt()->>'role' = 'service_role'
  OR
  is_valid_profile_uuid((uuid)::text)
);

-- Allow service role to DELETE
CREATE POLICY "Service role can delete jobs"
ON public.jobs
FOR DELETE
USING (
  auth.jwt()->>'role' = 'service_role'
  OR
  is_valid_profile_uuid((uuid)::text)
);