-- Drop the authenticated-only policies
DROP POLICY IF EXISTS "Authenticated users can insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can delete jobs" ON public.jobs;

-- Allow anonymous/public inserts for n8n automation
CREATE POLICY "Allow public inserts for automation"
ON public.jobs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow public updates
CREATE POLICY "Allow public updates for automation"
ON public.jobs
FOR UPDATE
TO anon, authenticated
USING (true);

-- Allow public deletes
CREATE POLICY "Allow public deletes for automation"
ON public.jobs
FOR DELETE
TO anon, authenticated
USING (true);