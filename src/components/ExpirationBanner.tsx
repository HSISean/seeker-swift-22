import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';

export const ExpirationBanner = () => {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [daysUntilExpiration, setDaysUntilExpiration] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    const checkExpiration = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscriptions')
          .eq('id', user.id)
          .single();

        if (profile?.subscriptions) {
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('is_trial, trial_ends_at')
            .eq('id', profile.subscriptions)
            .single();

          if (subscription?.is_trial && subscription.trial_ends_at) {
            const trialEnd = new Date(subscription.trial_ends_at);
            const now = new Date();
            const daysDiff = differenceInDays(trialEnd, now);

            // Show banner if 1 day before or on the day of expiration
            if (daysDiff <= 1 && daysDiff >= 0) {
              setShowBanner(true);
              setExpirationDate(trialEnd);
              setDaysUntilExpiration(daysDiff);
            }
          }
        }
      } catch (error) {
        console.error('Failed to check expiration:', error);
      }
    };

    checkExpiration();
  }, [user]);

  if (!showBanner || !expirationDate) return null;

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {daysUntilExpiration === 0 ? (
          <>Your premium account expires today at {format(expirationDate, 'h:mm a')}!</>
        ) : (
          <>Your premium account expires tomorrow on {format(expirationDate, 'MMM d, yyyy')}.</>
        )}{' '}
        Please update your subscription to continue enjoying premium features.
      </AlertDescription>
    </Alert>
  );
};
