-- Allow authenticated users to insert jobs
CREATE POLICY "Authenticated users can insert jobs"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update jobs
CREATE POLICY "Authenticated users can update jobs"
ON public.jobs
FOR UPDATE
TO authenticated
USING (true);

-- Allow authenticated users to delete jobs
CREATE POLICY "Authenticated users can delete jobs"
ON public.jobs
FOR DELETE
TO authenticated
USING (true);