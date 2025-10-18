-- Drop existing restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Allow anon inserts for automation" ON public.jobs;
DROP POLICY IF EXISTS "Allow anon updates for automation" ON public.jobs;
DROP POLICY IF EXISTS "Allow anon deletes for automation" ON public.jobs;

-- Create permissive policies for automation
CREATE POLICY "Allow anon inserts for automation"
ON public.jobs
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon updates for automation"
ON public.jobs
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anon deletes for automation"
ON public.jobs
FOR DELETE
TO anon
USING (true);