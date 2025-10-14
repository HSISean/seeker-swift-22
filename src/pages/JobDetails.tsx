import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, DollarSign, ArrowLeft, Building2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salary_min: number;
  salary_max: number;
  employment_type: string;
  requirements: string[];
  company_id: string;
  companies: {
    id: string;
    name: string;
    description: string;
    logo_url: string;
    website: string;
  };
}

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJobDetails();
      if (user) checkApplication();
    }
  }, [id, user]);

  const fetchJobDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, companies(*)')
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
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="mb-4 text-3xl">{job.title}</CardTitle>
                  <div className="flex flex-wrap gap-4 text-muted-foreground">
                    <span
                      className="flex cursor-pointer items-center gap-1 hover:text-primary"
                      onClick={() => navigate(`/companies/${job.company_id}`)}
                    >
                      <Briefcase className="h-4 w-4" />
                      {job.companies.name}
                    </span>
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
              {job.salary_min && job.salary_max && (
                <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                  <DollarSign className="h-5 w-5" />
                  <span>
                    ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} / year
                  </span>
                </div>
              )}

              <div>
                <h3 className="mb-2 text-lg font-semibold">About the Role</h3>
                <p className="text-muted-foreground">{job.description}</p>
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
                    {applying ? 'Submitting...' : 'Apply Now'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => navigate(`/companies/${job.company_id}`)}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  View Company
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default JobDetails;
