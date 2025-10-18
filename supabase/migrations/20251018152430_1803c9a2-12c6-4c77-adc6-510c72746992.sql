-- Restore anon policies for n8n automation
-- Note: These policies allow unauthenticated access - not production-ready

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