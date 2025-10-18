-- Add uuid field to jobs table to match with profiles
ALTER TABLE public.jobs 
ADD COLUMN uuid character varying;

-- Create security definer function to get user's uuid from profile
CREATE OR REPLACE FUNCTION public.get_user_uuid(_user_id uuid)
RETURNS character varying
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT uuid 
  FROM public.profiles 
  WHERE id = _user_id
  LIMIT 1;
$$;

-- Drop the existing "Anyone can view active jobs" policy
DROP POLICY IF EXISTS "Anyone can view active jobs" ON public.jobs;

-- Create new policy: users can only see active jobs matching their uuid
CREATE POLICY "Users can view jobs matching their uuid" 
ON public.jobs
FOR SELECT 
USING (
  is_active = true 
  AND uuid = public.get_user_uuid(auth.uid())
);