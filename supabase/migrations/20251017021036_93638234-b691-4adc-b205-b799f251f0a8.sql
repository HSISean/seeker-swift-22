-- Drop the incorrect foreign key
ALTER TABLE public.profiles
DROP CONSTRAINT profiles_subscriptions_fkey;

-- Add the correct foreign key pointing to subscriptions table
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_subscriptions_fkey 
FOREIGN KEY (subscriptions) 
REFERENCES public.subscriptions(id)
ON DELETE SET NULL;