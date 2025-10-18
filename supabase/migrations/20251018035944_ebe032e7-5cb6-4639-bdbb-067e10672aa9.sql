-- Add Stripe columns to subscription_type table
ALTER TABLE public.subscription_type 
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

-- Update subscription_type table with Stripe price IDs
UPDATE public.subscription_type 
SET stripe_price_id = 'price_1SJRHpA7TEbCTWePmIuNFTnH',
    stripe_product_id = 'prod_TFxCLFHJr3q3nF'
WHERE interest_level = 'browsing';

UPDATE public.subscription_type 
SET stripe_price_id = 'price_1SJRIGA7TEbCTWePROHoq1yS',
    stripe_product_id = 'prod_TFxCzf9AYNPYTG'
WHERE interest_level = 'actively_looking';

UPDATE public.subscription_type 
SET stripe_price_id = 'price_1SJRIRA7TEbCTWePdebcZ0JQ',
    stripe_product_id = 'prod_TFxCgvfGZ1yBEK'
WHERE interest_level = 'on_the_hunt';

UPDATE public.subscription_type 
SET stripe_price_id = 'price_1SJRIfA7TEbCTWePNWOkdjCL',
    stripe_product_id = 'prod_TFxDRADueSKg8I'
WHERE interest_level = 'need_a_job_asap';