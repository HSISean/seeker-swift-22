import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Briefcase, MapPin, DollarSign, ArrowLeft, CheckCircle2, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salary: string;
  employment_type: string;
  requirements: string[];
  company_name: string;
  company_logo_url?: string;
  company_link?: string;
  job_link?: string;
  resume_link?: string;
}

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [resumeDownloadsCount, setResumeDownloadsCount] = useState(0);
  const [resumeLimit, setResumeLimit] = useState<number | null>(null);
  const [resetDate, setResetDate] = useState<Date | null>(null);

  useEffect(() => {
    if (id) {
      fetchJobDetails();
      if (user) {
        checkApplication();
        fetchResumeDownloadInfo();
      }
    }
  }, [id, user]);

  const fetchResumeDownloadInfo = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscriptions, resume_downloads_count, resume_downloads_reset_at')
        .eq('id', user?.id)
        .single();

      if (profile) {
        const resetAt = new Date(profile.resume_downloads_reset_at);
        const now = new Date();
        
        // Reset count if we're past the reset date
        if (now > resetAt) {
          const newResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          await supabase
            .from('profiles')
            .update({
              resume_downloads_count: 0,
              resume_downloads_reset_at: newResetDate.toISOString()
            })
            .eq('id', user?.id);
          setResumeDownloadsCount(0);
          setResetDate(newResetDate);
        } else {
          setResumeDownloadsCount(profile.resume_downloads_count || 0);
          setResetDate(resetAt);
        }

        if (profile.subscriptions) {
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('subscription_type_id')
            .eq('id', profile.subscriptions)
            .single();

          if (subscription?.subscription_type_id) {
            const { data: subType } = await supabase
              .from('subscription_type')
              .select('resume_subscription')
              .eq('id', subscription.subscription_type_id)
              .single();

            if (subType?.resume_subscription) {
              const resumeSub = subType.resume_subscription;
              const limit = resumeSub === '0.00' ? null : // unlimited
                          resumeSub === '5.99' ? null : // all
                          resumeSub === '3.99' ? 200 :
                          resumeSub === '2.99' ? 60 : 10;
              setResumeLimit(limit);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch resume download info:', error);
    }
  };

  const fetchJobDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error: any) {
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const checkApplication = async () => {
    try {
      const { data } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', id)
        .eq('user_id', user?.id)
        .maybeSingle();

      setHasApplied(!!data);
    } catch (error) {
      console.error('Error checking application:', error);
    }
  };

  const handleApply = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    if (job?.job_link) {
      window.open(job.job_link, '_blank');
    }

    setApplying(true);
    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          job_id: id,
          user_id: user.id,
        });

      if (error) throw error;

      setHasApplied(true);
      toast.success('Application submitted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  const handleDownloadResume = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    if (resumeLimit !== null && resumeDownloadsCount >= resumeLimit) {
      toast.error(`Resume download limit reached. Resets on ${resetDate?.toLocaleDateString()}`);
      return;
    }

    if (job?.resume_link) {
      window.open(job.resume_link, '_blank');
      
      // Increment download count
      try {
        await supabase
          .from('profiles')
          .update({ resume_downloads_count: resumeDownloadsCount + 1 })
          .eq('id', user.id);
        
        setResumeDownloadsCount(prev => prev + 1);
        toast.success('Resume opened successfully!');
      } catch (error) {
        console.error('Failed to update download count:', error);
      }
    } else {
      toast.error('Resume not available for this job');
    }
  };

  const canDownloadResume = resumeLimit === null || resumeDownloadsCount < resumeLimit;
  const descriptionText = job?.description || '';
  const shouldTruncate = descriptionText.length > 250;
  const displayDescription = shouldTruncate && !showFullDescription 
    ? descriptionText.substring(0, 250) + '...' 
    : descriptionText;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-xl text-muted-foreground">Job not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/jobs')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-6 mb-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={job.company_logo_url || ''} alt={job.company_name || 'Company'} />
                  <AvatarFallback className="text-2xl">{job.company_name?.charAt(0) || 'C'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="mb-2 text-3xl">{job.title}</CardTitle>
                  <div className="flex flex-wrap gap-4 text-muted-foreground">
                    {job.company_name && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {job.company_link ? (
                          <a 
                            href={job.company_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-primary hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {job.company_name}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          job.company_name
                        )}
                      </span>
                    )}
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                    )}
                  </div>
                </div>
                {job.employment_type && (
                  <Badge variant="secondary">{job.employment_type}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {job.salary && (
                <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                  <DollarSign className="h-5 w-5" />
                  <span>{job.salary}</span>
                </div>
              )}

              <div>
                <h3 className="mb-2 text-lg font-semibold">About the Role</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{displayDescription}</p>
                {shouldTruncate && (
                  <Button 
                    variant="link" 
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="px-0 mt-2"
                  >
                    {showFullDescription ? 'Show Less' : 'Show More'}
                  </Button>
                )}
              </div>

              {job.requirements && job.requirements.length > 0 && (
                <div>
                  <h3 className="mb-2 text-lg font-semibold">Requirements</h3>
                  <ul className="space-y-2">
                    {job.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                        <span className="text-muted-foreground">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-4">
                {hasApplied ? (
                  <Button disabled className="flex-1">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Already Applied
                  </Button>
                ) : (
                  <Button onClick={handleApply} disabled={applying} className="flex-1">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {applying ? 'Submitting...' : 'Apply Now'}
                  </Button>
                )}
                {job.resume_link && (
                  <Button 
                    onClick={handleDownloadResume} 
                    disabled={!canDownloadResume}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {canDownloadResume 
                      ? `Download Resume ${resumeLimit !== null ? `(${resumeDownloadsCount}/${resumeLimit})` : ''}`
                      : 'Limit Reached'
                    }
                  </Button>
                )}
              </div>
              {resumeLimit !== null && (
                <p className="text-sm text-muted-foreground text-center">
                  Downloads reset on {resetDate?.toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default JobDetails;
