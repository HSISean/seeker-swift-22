-- Fix INSERT policy to match SELECT/UPDATE/DELETE pattern using uuid
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.jobs;

-- INSERT policy now uses uuid matching (consistent with other policies)
CREATE POLICY "Allow insert for authenticated users"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK ((uuid)::text = (get_user_uuid(auth.uid()))::text);