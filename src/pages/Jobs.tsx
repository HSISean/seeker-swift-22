import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, MapPin, DollarSign, Search, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salary: string;
  employment_type: string;
  company_name: string;
  company_logo_url?: string;
  match_rating?: number;
}

const Jobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [subscriptionType, setSubscriptionType] = useState<string>('29.99');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchFilter, setMatchFilter] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
    if (user) {
      fetchUserSubscription();
      fetchApplications();
    }
  }, [user]);

  const fetchUserSubscription = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscriptions')
        .eq('id', user?.id)
        .single();

      if (profile?.subscriptions) {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('subscription_type_id')
          .eq('id', profile.subscriptions)
          .single();

        if (subscription?.subscription_type_id) {
          const { data: subType } = await supabase
            .from('subscription_type')
            .select('job_subscription')
            .eq('id', subscription.subscription_type_id)
            .single();

          if (subType?.job_subscription) {
            setSubscriptionType(subType.job_subscription);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const { data } = await supabase
        .from('applications')
        .select('job_id')
        .eq('user_id', user?.id);

      if (data) {
        setAppliedJobIds(new Set(data.map(app => app.job_id)));
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('posted_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const getMatchThreshold = (subType: string): number => {
    switch (subType) {
      case '29.99': return 0; // All jobs
      case '19.99': return 80; // High only
      case '9.99': return 60; // Medium and high
      case '4.99': return 0; // Low, medium, high (all)
      default: return 0;
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const rating = job.match_rating || 0;
    const threshold = getMatchThreshold(subscriptionType);
    
    const meetsSubscription = subscriptionType === '29.99' || subscriptionType === '4.99' 
      ? true 
      : rating >= threshold;

    if (matchFilter === 'all') return matchesSearch && meetsSubscription;
    
    if (matchFilter === 'high' && rating >= 80) return matchesSearch && meetsSubscription;
    if (matchFilter === 'medium' && rating >= 60 && rating < 80) return matchesSearch && meetsSubscription;
    if (matchFilter === 'low' && rating < 60) return matchesSearch && meetsSubscription;
    
    return false;
  });

  const getHighestMatch = () => {
    const unappliedJobs = filteredJobs.filter(job => !appliedJobIds.has(job.id));
    if (unappliedJobs.length === 0) return null;
    return unappliedJobs.reduce((prev, current) => 
      (current.match_rating || 0) > (prev.match_rating || 0) ? current : prev
    );
  };

  const highestMatchJob = getHighestMatch();

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
        <div className="mb-8">
          <h1 className="mb-4 text-4xl font-bold">Find Your Next Job</h1>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by title, company, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={matchFilter} onValueChange={setMatchFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by match" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Matches</SelectItem>
                <SelectItem value="high">High (80%+)</SelectItem>
                <SelectItem value="medium">Medium (60-79%)</SelectItem>
                <SelectItem value="low">Low (&lt;60%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredJobs.map((job) => {
              const isApplied = appliedJobIds.has(job.id);
              const isHighestMatch = highestMatchJob?.id === job.id;
              
              return (
                <Card
                  key={job.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isApplied ? 'opacity-50 grayscale' : ''
                  } ${isHighestMatch ? 'border-purple-500 border-2' : ''}`}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start gap-4 mb-2">
                      {job.company_logo_url && (
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={job.company_logo_url} alt={job.company_name || 'Company'} />
                          <AvatarFallback>{job.company_name?.charAt(0) || 'C'}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1 flex items-start justify-between gap-4">
                        <CardTitle className="flex-1">{job.title}</CardTitle>
                        {job.match_rating !== undefined && (
                          <Badge variant="secondary" className="shrink-0">
                            {job.match_rating}% Match
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardDescription className="flex items-center gap-4 text-base">
                          {job.company_name && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {job.company_name}
                            </span>
                          )}
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.location}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      {job.employment_type && (
                        <Badge variant="secondary">{job.employment_type}</Badge>
                      )}
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
              );
            })}
            {filteredJobs.length === 0 && !loading && (
              <div className="py-12 text-center">
                <p className="text-xl text-muted-foreground">No jobs found</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Jobs;
