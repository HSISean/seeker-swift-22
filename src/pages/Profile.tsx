import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import LocationAutocomplete, { loadGoogleMapsScript } from '@/components/LocationAutocomplete';

interface SubscriptionType {
  id?: string;
  interest_level: string | null;
  resume_subscription: string | null;
  job_subscription: string | null;
  cover_letter_subscription: string | null;
  stripe_price_id?: string | null;
  stripe_product_id?: string | null;
}

interface Subscription {
  id: string;
  trial_ends_at: string;
  is_trial: boolean;
  subscription_type: SubscriptionType | null;
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  job_title: string;
  job_titles: string[];
  location: string;
  salary_min: number;
  salary_max: number;
  resume_folder: string;
  subscriptions?: Subscription | null;
  next_billing_month?: string | null;
  created_at?: string;
}

interface Application {
  id: string;
  status: string;
  applied_at: string;
  jobs: {
    title: string;
    company_name: string;
  };
}

const Profile = () => {
  const { user, subscriptionStatus, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingSubscription, setSavingSubscription] = useState(false);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchApplications();
      fetchSubscriptionTypes();
    }
  }, [user]);

  useEffect(() => {
    loadGoogleMapsScript().catch((error) => {
      console.error('Failed to load Google Maps:', error);
    });
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;

      // Fetch subscription separately
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          trial_ends_at,
          is_trial,
          subscription_type:subscription_type_id (
            id,
            interest_level,
            resume_subscription,
            job_subscription,
            stripe_price_id,
            stripe_product_id,
            cover_letter_subscription
          )
        `)
        .eq('user_id', user?.id)
        .single();

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        console.error('Subscription fetch error:', subscriptionError);
      }

      setProfile({
        ...profileData,
        subscriptions: subscriptionData || null,
      });
    } catch (error: any) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_type')
        .select('*')
        .order('job_subscription', { ascending: true });

      if (error) throw error;
      setSubscriptionTypes(data || []);
    } catch (error: any) {
      console.error('Failed to load subscription types:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*, jobs(title, company_name)')
        .eq('user_id', user?.id)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      console.error('Failed to load applications:', error);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          job_title: profile.job_title,
          job_titles: profile.job_titles,
          location: profile.location,
          salary_min: profile.salary_min,
          salary_max: profile.salary_max,
        })
        .eq('id', user?.id);

      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      // Reset input value so the same file can be selected again
      e.target.value = '';
      const formData = new FormData();
      formData.append('file', file);

      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('upload-resume-to-s3', {
        body: formData,
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Upload failed');

      setProfile({ ...profile!, resume_folder: data.s3_url });
      toast.success('Resume uploaded successfully to S3!');
      
      // Refresh profile to get updated data
      await fetchProfile();
    } catch (error: any) {
      console.error('Resume upload error:', error);
      toast.error(error.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.subscriptions?.subscription_type) return;

    setSavingSubscription(true);
    try {
      // Find matching subscription type
      const subType = profile.subscriptions.subscription_type;
      const matchingType = subscriptionTypes.find(
        (t) =>
          t.interest_level === subType.interest_level &&
          t.resume_subscription === subType.resume_subscription &&
          t.job_subscription === subType.job_subscription &&
          t.cover_letter_subscription === subType.cover_letter_subscription
      );

      if (!matchingType) {
        toast.error('Selected subscription plan is not available');
        return;
      }

      // Update subscription to point to the matching type
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          subscription_type_id: matchingType.id,
          is_trial: false,
        })
        .eq('id', profile.subscriptions.id);

      if (updateError) throw updateError;
      
      toast.success('Subscription updated successfully!');
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update subscription');
    } finally {
      setSavingSubscription(false);
    }
  };

  const handleCheckout = async (priceId: string) => {
    if (!user) return;
    
    setCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success('Opening Stripe checkout...');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success('Opening subscription management portal...');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open subscription management');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/home')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-8">
          <h1 className="text-4xl font-bold">My Profile</h1>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile?.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile?.full_name || ''}
                    onChange={(e) =>
                      setProfile({ ...profile!, full_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={profile?.job_title || ''}
                    onChange={(e) =>
                      setProfile({ ...profile!, job_title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Additional Job Titles (Max 3)</Label>
                  {[0, 1, 2].map((index) => (
                    <Input
                      key={index}
                      placeholder={`Job title ${index + 1}`}
                      value={profile?.job_titles?.[index] || ''}
                      onChange={(e) => {
                        const newTitles = [...(profile?.job_titles || [])];
                        newTitles[index] = e.target.value;
                        setProfile({ ...profile!, job_titles: newTitles.filter(t => t) });
                      }}
                    />
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Add up to 3 job titles you're interested in
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <LocationAutocomplete
                    value={profile?.location || ''}
                    onChange={(value) =>
                      setProfile({ ...profile!, location: value })
                    }
                  />
                </div>
                {profile?.next_billing_month && (
                  <div className="space-y-2">
                    <Label>Next Billing Date</Label>
                    <div className="text-sm text-muted-foreground">
                      {new Date(profile.next_billing_month).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salaryMin">Min Salary ($)</Label>
                    <Input
                      id="salaryMin"
                      type="number"
                      value={profile?.salary_min || ''}
                      onChange={(e) =>
                        setProfile({
                          ...profile!,
                          salary_min: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salaryMax">Max Salary ($)</Label>
                    <Input
                      id="salaryMax"
                      type="number"
                      value={profile?.salary_max || ''}
                      onChange={(e) =>
                        setProfile({
                          ...profile!,
                          salary_max: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Subscription Plan</CardTitle>
                {subscriptionStatus?.subscribed && (
                  <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                    Manage Subscription
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile?.subscriptions?.is_trial && (
                <div className="rounded-lg bg-primary/10 p-4">
                  <p className="text-sm font-medium">
                    🎉 You're on a free trial! Trial ends:{' '}
                    {new Date(profile.subscriptions.trial_ends_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              {subscriptionStatus?.subscribed && (
                <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <p className="font-medium text-primary">Active Subscription</p>
                  </div>
                  {subscriptionStatus.subscription_end && (
                    <p className="text-sm text-muted-foreground">
                      Renews on: {new Date(subscriptionStatus.subscription_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <Label>Choose Your Plan</Label>
                <div className="grid gap-4">
                  {subscriptionTypes.map((type) => {
                    const isCurrentPlan = subscriptionStatus?.product_id === type.stripe_product_id;
                    const totalPrice = parseFloat(type.job_subscription || '0') + 
                                     parseFloat(type.cover_letter_subscription || '0') + 
                                     parseFloat(type.resume_subscription || '0');
                    
                    return (
                      <div 
                        key={type.id} 
                        className={`rounded-lg border-2 p-4 ${isCurrentPlan ? 'border-primary bg-primary/5' : 'border-border'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold capitalize">
                                {type.interest_level?.replace(/_/g, ' ')}
                              </h3>
                              {isCurrentPlan && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                                  Current Plan
                                </span>
                              )}
                            </div>
                            <p className="text-2xl font-bold mb-2">
                              ${totalPrice.toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/month</span>
                            </p>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                              <li>• Job subscription: ${type.job_subscription}</li>
                              <li>• Resume: ${type.resume_subscription}</li>
                              <li>• Cover Letter: ${type.cover_letter_subscription}</li>
                            </ul>
                          </div>
                          {!isCurrentPlan && type.stripe_price_id && (
                            <Button 
                              onClick={() => handleCheckout(type.stripe_price_id!)}
                              disabled={checkingOut}
                              size="sm"
                            >
                              {checkingOut ? 'Processing...' : 'Subscribe'}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {profile?.created_at && !subscriptionStatus?.subscribed && (
                <div className="text-sm text-muted-foreground">
                  First payment due: {(() => {
                    const createdDate = new Date(profile.created_at);
                    const fourthDayAfterSignup = new Date(createdDate);
                    fourthDayAfterSignup.setDate(createdDate.getDate() + 4);
                    return fourthDayAfterSignup.toLocaleDateString();
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resume</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile?.resume_folder ? (
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">Resume uploaded</p>
                      <a
                        href={profile.resume_folder}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View resume
                      </a>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    disabled={uploading}
                    onClick={() => document.getElementById('resume')?.click()}
                  >
                    {uploading ? 'Uploading...' : 'Replace'}
                  </Button>
                </div>
              ) : (
                <Label
                  htmlFor="resume"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors hover:border-primary"
                >
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {uploading ? 'Uploading...' : 'Click to upload resume'}
                  </span>
                </Label>
              )}
              <Input
                id="resume"
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleResumeUpload}
                disabled={uploading}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Applications ({applications.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">{app.jobs.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {app.jobs.company_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="text-sm capitalize">{app.status}</span>
                    </div>
                  </div>
                ))}
                {applications.length === 0 && (
                  <p className="py-8 text-center text-muted-foreground">
                    No applications yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
