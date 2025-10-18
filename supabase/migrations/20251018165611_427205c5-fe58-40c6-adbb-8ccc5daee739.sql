-- Drop existing restrictive policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create new policies that allow service role (n8n) read access
CREATE POLICY "Service role and users can view profiles"
ON public.profiles
FOR SELECT
USING (
  -- Service role can see all profiles
  auth.jwt()->>'role' = 'service_role'
  OR
  -- Users can see their own profile
  auth.uid() = id
);

-- Allow users and service role to insert profiles
CREATE POLICY "Service role and users can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (
  auth.jwt()->>'role' = 'service_role'
  OR
  auth.uid() = id
);

-- Allow users and service role to update profiles
CREATE POLICY "Service role and users can update profiles"
ON public.profiles
FOR UPDATE
USING (
  auth.jwt()->>'role' = 'service_role'
  OR
  auth.uid() = id
)
WITH CHECK (
  auth.jwt()->>'role' = 'service_role'
  OR
  auth.uid() = id
);