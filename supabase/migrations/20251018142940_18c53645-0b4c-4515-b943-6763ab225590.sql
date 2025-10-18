-- First, drop the overly permissive policies
DROP POLICY IF EXISTS "Allow anon inserts for automation" ON public.jobs;
DROP POLICY IF EXISTS "Allow anon updates for automation" ON public.jobs;
DROP POLICY IF EXISTS "Allow anon deletes for automation" ON public.jobs;
DROP POLICY IF EXISTS "Allow authenticated inserts for automation" ON public.jobs;
DROP POLICY IF EXISTS "Allow authenticated updates for automation" ON public.jobs;
DROP POLICY IF EXISTS "Allow authenticated deletes for automation" ON public.jobs;

-- Allow only authenticated users to insert jobs,
-- and only if they insert their own user_profile_id
CREATE POLICY "Allow insert for authenticated users"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (user_profile_id = auth.uid());

-- Allow authenticated users to update their own jobs
CREATE POLICY "Allow update for authenticated users"
ON public.jobs
FOR UPDATE
TO authenticated
USING (user_profile_id = auth.uid())
WITH CHECK (user_profile_id = auth.uid());

-- Allow authenticated users to delete their own jobs
CREATE POLICY "Allow delete for authenticated users"
ON public.jobs
FOR DELETE
TO authenticated
USING (user_profile_id = auth.uid());