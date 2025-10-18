-- Add back anon policies for n8n automation
-- Note: Using service role key in n8n is more secure than these policies
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