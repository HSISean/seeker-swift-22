-- Add INSERT policy for subscriptions table
CREATE POLICY "Users can create own subscription"
ON public.subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);