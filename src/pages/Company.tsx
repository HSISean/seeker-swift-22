import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, DollarSign, Globe, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Company {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  website: string;
  location: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salary: string;
  employment_type: string;
  match_rating?: number;
}

const Company = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCompanyData();
    }
  }, [id]);

  const fetchCompanyData = async () => {
    try {
      // First fetch company data
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);

      // Then fetch jobs and applications in parallel
      const [jobsResult, applicationsResult] = await Promise.all([
        supabase
          .from('jobs')
          .select('*')
          .eq('company_name', companyData.name)
          .eq('is_active', true),
        user
          ? supabase
              .from('applications')
              .select('job_id')
              .eq('user_id', user.id)
          : Promise.resolve({ data: null }),
      ]);

      if (jobsResult.error) throw jobsResult.error;
      setJobs(jobsResult.data || []);
      
      if (applicationsResult.data) {
        setApplications(new Set(applicationsResult.data.map((a) => a.job_id)));
      }
    } catch (error: any) {
      toast.error('Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-xl text-muted-foreground">Company not found</p>
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
        <div className="mx-auto max-w-4xl space-y-8">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-6">
                {company.logo_url && (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <CardTitle className="mb-2 text-3xl">{company.name}</CardTitle>
                  <div className="flex flex-wrap gap-4 text-muted-foreground">
                    {company.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {company.location}
                      </span>
                    )}
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        <Globe className="h-4 w-4" />
                        Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="mb-2 text-lg font-semibold">About</h3>
              <p className="text-muted-foreground">{company.description}</p>
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-4 text-2xl font-bold">
              Open Positions ({jobs.length})
            </h2>
            
            {/* Top 3 Highest Matches - Parallax Scroll */}
            {jobs.filter(j => j.match_rating).length > 0 && (
              <div className="mb-8">
                <h3 className="mb-4 text-lg font-semibold">Top Matches</h3>
                <div className="relative overflow-x-auto pb-4">
                  <div className="flex gap-6 snap-x snap-mandatory" style={{ width: 'max-content' }}>
                    {jobs
                      .filter(j => j.match_rating !== undefined)
                      .sort((a, b) => (b.match_rating || 0) - (a.match_rating || 0))
                      .slice(0, 3)
                      .map((job, index) => (
                        <Card
                          key={job.id}
                          className="w-[350px] cursor-pointer snap-center transition-all hover:shadow-lg flex-shrink-0"
                          onClick={() => navigate(`/jobs/${job.id}`)}
                          style={{
                            transform: `translateX(${index * -20}px)`,
                            zIndex: 3 - index,
                          }}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <CardTitle className="flex-1">{job.title}</CardTitle>
                              <Badge variant="default" className="shrink-0">
                                {job.match_rating}% Match
                              </Badge>
                            </div>
                            <CardDescription className="flex items-center gap-4">
                              {job.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {job.location}
                                </span>
                              )}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="mb-4 text-muted-foreground line-clamp-2">
                              {job.description}
                            </p>
                            {job.salary && (
                              <div className="flex items-center gap-2 text-primary">
                                <DollarSign className="h-4 w-4" />
                                <span className="font-semibold">{job.salary}</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* All Other Jobs */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">All Positions</h3>
              {jobs.map((job) => (
                <Card
                  key={job.id}
                  className="cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <CardTitle className="flex-1">{job.title}</CardTitle>
                      {job.match_rating !== undefined && (
                        <Badge variant="secondary" className="shrink-0">
                          {job.match_rating}% Match
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardDescription className="flex items-center gap-4">
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.location}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {job.employment_type && (
                          <Badge variant="secondary">{job.employment_type}</Badge>
                        )}
                        {applications.has(job.id) && (
                          <Badge className="bg-primary/10 text-primary">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Applied
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-muted-foreground line-clamp-2">
                      {job.description}
                    </p>
                    {job.salary && (
                      <div className="flex items-center gap-2 text-primary">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold">
                          {job.salary}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {jobs.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">
                  No open positions at the moment
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Company;
