-- Drop all existing policies on jobs table
DROP POLICY IF EXISTS "Allow public inserts for automation" ON public.jobs;
DROP POLICY IF EXISTS "Allow public updates for automation" ON public.jobs;
DROP POLICY IF EXISTS "Allow public deletes for automation" ON public.jobs;
DROP POLICY IF EXISTS "Users can view jobs matching their uuid" ON public.jobs;

-- Recreate policies with correct permissions for automation and users
CREATE POLICY "Allow anon inserts for automation"
ON public.jobs
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon updates for automation"
ON public.jobs
FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Allow anon deletes for automation"
ON public.jobs
FOR DELETE
TO anon
USING (true);

CREATE POLICY "Users can view jobs matching their uuid"
ON public.jobs
FOR SELECT
TO authenticated
USING ((is_active = true) AND ((uuid)::text = (get_user_uuid(auth.uid()))::text));