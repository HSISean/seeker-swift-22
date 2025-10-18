-- Make title and description nullable on jobs table
ALTER TABLE public.jobs 
ALTER COLUMN title DROP NOT NULL,
ALTER COLUMN description DROP NOT NULL;