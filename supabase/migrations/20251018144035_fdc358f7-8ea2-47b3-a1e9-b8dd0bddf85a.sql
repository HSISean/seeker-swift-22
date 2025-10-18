-- Remove insecure anon policies
DROP POLICY IF EXISTS "Allow anon inserts for automation" ON public.jobs;
DROP POLICY IF EXISTS "Allow anon updates for automation" ON public.jobs;
DROP POLICY IF EXISTS "Allow anon deletes for automation" ON public.jobs;

-- Keep only the secure authenticated policies
-- (These already exist, just confirming they're the only ones)
-- Users can only insert/update/delete their own jobs via user_profile_id = auth.uid()