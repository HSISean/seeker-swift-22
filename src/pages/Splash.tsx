import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Search, Building2, TrendingUp } from 'lucide-react';

const Splash = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">JobFinder</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/signin')}>
              Sign In
            </Button>
            <Button onClick={() => navigate('/signup')}>
              Get Started
            </Button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Find Your Dream Job{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Today
            </span>
          </h1>
          <p className="mb-12 text-xl text-muted-foreground">
            Connect with top companies and discover opportunities that match your skills and salary expectations.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto" onClick={() => navigate('/signup')}>
              Start Your Journey
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={() => navigate('/jobs')}>
              Browse Jobs
            </Button>
          </div>

          <div className="mt-20 grid gap-8 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Search className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Smart Search</h3>
              <p className="text-sm text-muted-foreground">
                Find jobs that match your skills and salary requirements
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <Building2 className="h-6 w-6 text-accent" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Top Companies</h3>
              <p className="text-sm text-muted-foreground">
                Access opportunities from leading employers worldwide
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Career Growth</h3>
              <p className="text-sm text-muted-foreground">
                Track applications and advance your professional journey
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Splash;
