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

interface SubscriptionType {
  id?: string;
  interest_level: string | null;
  resume_subscription: string | null;
  job_subscription: string | null;
  cover_letter_subscription: string | null;
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
  location: string;
  salary_min: number;
  salary_max: number;
  resume_url: string;
  subscriptions?: Subscription | null;
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingSubscription, setSavingSubscription] = useState(false);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchApplications();
      fetchSubscriptionTypes();
    }
  }, [user]);

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
        .select('*');

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
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/resume.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ resume_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile!, resume_url: publicUrl });
      toast.success('Resume uploaded successfully!');
    } catch (error: any) {
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
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile?.location || ''}
                    onChange={(e) =>
                      setProfile({ ...profile!, location: e.target.value })
                    }
                  />
                </div>
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
              <CardTitle>Subscription Plan</CardTitle>
            </CardHeader>
            <CardContent>
              {profile?.subscriptions?.subscription_type ? (
                <form onSubmit={handleSaveSubscription} className="space-y-6">
                  {profile.subscriptions.is_trial && (
                    <div className="rounded-lg bg-primary/10 p-4">
                      <p className="text-sm font-medium">
                        🎉 You're on a free trial! Trial ends:{' '}
                        {new Date(profile.subscriptions.trial_ends_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="interestLevel">Interest Level</Label>
                      <Select
                        value={profile.subscriptions.subscription_type.interest_level || ''}
                        onValueChange={(value) =>
                          setProfile({
                            ...profile,
                            subscriptions: {
                              ...profile.subscriptions!,
                              subscription_type: {
                                ...profile.subscriptions!.subscription_type!,
                                interest_level: value,
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="browsing">Browsing</SelectItem>
                          <SelectItem value="actively_looking">Actively Looking</SelectItem>
                          <SelectItem value="on_the_hunt">On the Hunt</SelectItem>
                          <SelectItem value="need_a_job_asap">Need a Job ASAP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="resumeSubscription">Resume Subscription</Label>
                      <Select
                        value={profile.subscriptions.subscription_type.resume_subscription || ''}
                        onValueChange={(value) =>
                          setProfile({
                            ...profile,
                            subscriptions: {
                              ...profile.subscriptions!,
                              subscription_type: {
                                ...profile.subscriptions!.subscription_type!,
                                resume_subscription: value,
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.00">Free ($0.00)</SelectItem>
                          <SelectItem value="2.99">Basic ($2.99)</SelectItem>
                          <SelectItem value="3.99">Plus ($3.99)</SelectItem>
                          <SelectItem value="5.99">Premium ($5.99)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jobSubscription">Job Subscription</Label>
                      <Select
                        value={profile.subscriptions.subscription_type.job_subscription || ''}
                        onValueChange={(value) =>
                          setProfile({
                            ...profile,
                            subscriptions: {
                              ...profile.subscriptions!,
                              subscription_type: {
                                ...profile.subscriptions!.subscription_type!,
                                job_subscription: value,
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.00">Free ($0.00)</SelectItem>
                          <SelectItem value="6.99">Basic ($6.99)</SelectItem>
                          <SelectItem value="15.99">Plus ($15.99)</SelectItem>
                          <SelectItem value="29.99">Premium ($29.99)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coverLetterSubscription">Cover Letter Subscription</Label>
                      <Select
                        value={profile.subscriptions.subscription_type.cover_letter_subscription || ''}
                        onValueChange={(value) =>
                          setProfile({
                            ...profile,
                            subscriptions: {
                              ...profile.subscriptions!,
                              subscription_type: {
                                ...profile.subscriptions!.subscription_type!,
                                cover_letter_subscription: value,
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.00">Free ($0.00)</SelectItem>
                          <SelectItem value="2.99">Premium ($2.99)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button type="submit" disabled={savingSubscription}>
                    {savingSubscription ? 'Saving...' : 'Update Subscription'}
                  </Button>
                </form>
              ) : (
                <p className="py-4 text-center text-muted-foreground">
                  No subscription plan found
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resume</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile?.resume_url ? (
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">Resume uploaded</p>
                      <a
                        href={profile.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View resume
                      </a>
                    </div>
                  </div>
                  <Label htmlFor="resume" className="cursor-pointer">
                    <Button type="button" variant="outline" disabled={uploading}>
                      {uploading ? 'Uploading...' : 'Replace'}
                    </Button>
                  </Label>
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
