-- Grant table-level permissions to anon role for jobs table
GRANT INSERT, UPDATE, DELETE, SELECT ON public.jobs TO anon;