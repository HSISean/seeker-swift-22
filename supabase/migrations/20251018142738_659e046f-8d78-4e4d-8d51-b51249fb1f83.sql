-- Add permissive policies for authenticated role as well
CREATE POLICY "Allow authenticated inserts for automation"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated updates for automation"
ON public.jobs
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated deletes for automation"
ON public.jobs
FOR DELETE
TO authenticated
USING (true);