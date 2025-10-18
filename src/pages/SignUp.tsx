import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Briefcase } from 'lucide-react';
import LocationAutocomplete, { loadGoogleMapsScript } from '@/components/LocationAutocomplete';

const SignUp = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    jobTitle: '',
    location: '',
    salaryMin: '',
    salaryMax: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => setMapsLoaded(true))
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
        toast.error('Location autocomplete unavailable');
      });
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resumeFile) {
      toast.error('Please upload your resume');
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (error) throw error;

      // Get user session and upload resume to S3
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Create FormData for edge function
        const formDataToSend = new FormData();
        formDataToSend.append('file', resumeFile);

        // Upload resume to S3 via edge function with authorization
        const { data: uploadData, error: uploadError } = await supabase.functions.invoke(
          'upload-resume-to-s3',
          {
            body: formDataToSend,
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          }
        );

        if (uploadError) {
          console.error('S3 upload error:', uploadError);
          throw new Error('Failed to upload resume to storage');
        }

        if (!uploadData?.success) {
          throw new Error(uploadData?.error || 'Failed to upload resume');
        }

        // Calculate enhanced resume folder by replacing "original_resume" with "enhanced_resume"
        const enhancedResumeFolder = uploadData.s3_url.replace('original_resume', 'enhanced_resume');

        // Update profile with job info and resume data
        await supabase
          .from('profiles')
          .update({
            job_title: formData.jobTitle,
            job_titles: [formData.jobTitle],
            location: formData.location,
            salary_min: parseInt(formData.salaryMin) || null,
            salary_max: parseInt(formData.salaryMax) || null,
            resume_folder: uploadData.s3_url,
            resume_key: uploadData.s3_key,
            enhanced_resume_folder: enhancedResumeFolder,
          })
          .eq('id', user.id);

        console.log('Resume uploaded to S3:', uploadData);
      }

      toast.success('Account created successfully!');
      navigate('/home');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to sign up';
      
      // Handle "user already exists" errors with helpful message
      if (errorMessage.includes('already registered') || errorMessage.includes('User already registered')) {
        toast.error('This email is already registered. Please sign in or use a different email.', {
          action: {
            label: 'Sign In',
            onClick: () => navigate('/signin')
          }
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Enter your details to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Current Job Title</Label>
              <Input
                id="jobTitle"
                placeholder="e.g., Software Engineer"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              {mapsLoaded ? (
                <LocationAutocomplete
                  value={formData.location}
                  onChange={(value) => setFormData({ ...formData, location: value })}
                  required
                />
              ) : (
                <Input
                  id="location"
                  placeholder="Loading location search..."
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  disabled
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salaryMin">Min Salary ($)</Label>
                <Input
                  id="salaryMin"
                  type="number"
                  placeholder="50000"
                  value={formData.salaryMin}
                  onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryMax">Max Salary ($)</Label>
                <Input
                  id="salaryMax"
                  type="number"
                  placeholder="100000"
                  value={formData.salaryMax}
                  onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resume">Resume *</Label>
              <Input
                id="resume"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Accepted formats: PDF, DOC, DOCX
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link to="/signin" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUp;
