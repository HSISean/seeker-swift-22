import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export const JobUpdateBanner = () => {
  return (
    <Alert className="mb-6">
      <Info className="h-4 w-4" />
      <AlertDescription>
        Job listings are updated daily at 10:00 AM. Check back regularly for the latest opportunities!
      </AlertDescription>
    </Alert>
  );
};
