-- Drop and recreate the insert policy for jobs table to fix automation access
DROP POLICY IF EXISTS "Allow public inserts for automation" ON public.jobs;

CREATE POLICY "Allow public inserts for automation"
ON public.jobs
FOR INSERT
TO public, anon, authenticated
WITH CHECK (true);