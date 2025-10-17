
-- Add missing enum values for subscription tiers
ALTER TYPE job_subscription_enum ADD VALUE IF NOT EXISTS '4.99';
ALTER TYPE job_subscription_enum ADD VALUE IF NOT EXISTS '9.99';
ALTER TYPE job_subscription_enum ADD VALUE IF NOT EXISTS '19.99';

ALTER TYPE resume_subscription_enum ADD VALUE IF NOT EXISTS '2.99';
ALTER TYPE resume_subscription_enum ADD VALUE IF NOT EXISTS '3.99';

ALTER TYPE cover_letter_subscription_enum ADD VALUE IF NOT EXISTS '0.99';
ALTER TYPE cover_letter_subscription_enum ADD VALUE IF NOT EXISTS '1.99';
