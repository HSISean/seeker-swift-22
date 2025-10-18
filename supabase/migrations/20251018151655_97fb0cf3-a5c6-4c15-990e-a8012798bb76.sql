-- Fix RLS policies to be consistent - use uuid matching for all operations
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.jobs;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.jobs;

-- Update policy using uuid matching (consistent with SELECT policy)
CREATE POLICY "Allow update for authenticated users"
ON public.jobs
FOR UPDATE
TO authenticated
USING ((uuid)::text = (get_user_uuid(auth.uid()))::text)
WITH CHECK ((uuid)::text = (get_user_uuid(auth.uid()))::text);

-- Delete policy using uuid matching (consistent with SELECT policy)
CREATE POLICY "Allow delete for authenticated users"
ON public.jobs
FOR DELETE
TO authenticated
USING ((uuid)::text = (get_user_uuid(auth.uid()))::text);