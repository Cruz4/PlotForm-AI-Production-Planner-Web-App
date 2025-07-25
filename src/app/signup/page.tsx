
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import { Loader2, Home } from 'lucide-react';
import AuthLayout from '../auth-layout';

// A simple SVG for Google icon
const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signup, signInWithGoogle, loading: authIsLoading } = useAuth();
  const [isEmailSignupLoading, setIsEmailSignupLoading] = useState(false);
  const [isGoogleSignupLoading, setIsGoogleSignupLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    if (!email || !password) {
      toast({ title: 'Error', description: 'Please fill in all fields.', variant: 'destructive' });
      return;
    }
    setIsEmailSignupLoading(true);
    try {
      await signup(email, password);
      toast({ title: 'Success', description: 'Account created successfully! Redirecting...' });
    } catch (error: any) {
       toast({ title: 'Signup Failed', description: error.message || 'An unknown error occurred.', variant: 'destructive' });
    } finally {
      setIsEmailSignupLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSignupLoading(true);
    try {
      await signInWithGoogle();
      toast({ title: 'Success', description: 'Signed up with Google successfully!' });
    } catch (error: any) {
      toast({ title: 'Google Sign-Up Failed', description: error.message || 'An unknown error occurred.', variant: 'destructive' });
    } finally {
      setIsGoogleSignupLoading(false);
    }
  };

  const isAnyLoading = authIsLoading || isEmailSignupLoading || isGoogleSignupLoading;

  return (
    <AuthLayout>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <Image src="/logo.png" alt="PlotForm Ai Production Planner Logo" width={80} height={80} className="mx-auto mb-4 rounded-lg shadow-md" data-ai-hint="app logo" />
          <CardTitle className="text-3xl font-bold text-primary">{APP_NAME}</CardTitle>
          <CardDescription>Create your account to start planning.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-input/50"
                autoComplete="email"
                disabled={isAnyLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-input/50"
                autoComplete="new-password"
                disabled={isAnyLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-input/50"
                autoComplete="new-password"
                disabled={isAnyLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isAnyLoading}>
              {isEmailSignupLoading ? <Loader2 className="animate-spin" /> : 'Sign Up'}
            </Button>
          </form>

          <div className="my-4 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-border after:mt-0.5 after:flex-1 after:border-t after:border-border">
            <p className="mx-4 mb-0 text-center font-semibold text-muted-foreground">OR</p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isAnyLoading}
          >
            {isGoogleSignupLoading ? <Loader2 className="animate-spin" /> : <><GoogleIcon /> Sign up with Google</>}
          </Button>

          <p className="mt-6 text-center text-sm">
            <Link href="/" className="font-medium text-muted-foreground hover:text-primary/90 flex items-center justify-center">
              <Home className="mr-1.5 h-4 w-4" /> Back to Home
            </Link>
          </p>

          <p className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-accent hover:text-accent/90">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
