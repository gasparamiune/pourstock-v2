import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2, Loader2, Eye, EyeOff, UserPlus, Hotel, ArrowLeft, Mail, Check,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

// ─── Schemas ────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;
type ForgotFormData = z.infer<typeof forgotSchema>;

type SignupMode = null | 'join' | 'create';

// ─── Component ──────────────────────────────────────────────────────────────

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, resetPassword, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [isForgot, setIsForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [signupMode, setSignupMode] = useState<SignupMode>(null);

  useEffect(() => {
    if (user && !authLoading) navigate('/');
  }, [user, authLoading, navigate]);

  // ── Forms ────────────────────────────────────────────────────────────────

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const forgotForm = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message === 'Invalid login credentials'
          ? 'Invalid email or password. Please try again.'
          : error.message,
      });
    } else {
      navigate('/');
    }
  };

  const onForgot = async (data: ForgotFormData) => {
    setIsLoading(true);
    const { error } = await resetPassword(data.email);
    setIsLoading(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setForgotSent(true);
    }
  };

  const onSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    // If creating a hotel, store intent so Onboarding can detect it
    if (signupMode === 'create') {
      sessionStorage.setItem('pendingHotelSetup', 'true');
    }
    const { error } = await signUp(data.email, data.password, data.fullName);
    setIsLoading(false);
    if (error) {
      sessionStorage.removeItem('pendingHotelSetup');
      let message = error.message;
      if (error.message.includes('already registered')) {
        message = 'This email is already registered. Please log in instead.';
      }
      toast({ variant: 'destructive', title: 'Sign up failed', description: message });
    } else {
      toast({
        title: signupMode === 'create' ? 'Account created!' : 'Account created!',
        description: 'Check your email to verify your account, then sign in.',
      });
      signupForm.reset();
      setSignupMode(null);
      setActiveTab('login');
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsForgot(false);
    setForgotSent(false);
    setSignupMode(null);
  };

  // ── Loading splash ────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20 mb-4">
            <Building2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">PourStock</h1>
          <p className="text-muted-foreground mt-1">Hotel Operations Platform</p>
        </div>

        <Card className="glass-card border-border/50">
          <CardHeader className="text-center pb-4">
            <CardTitle>
              {isForgot ? 'Reset Password' : 'Welcome'}
            </CardTitle>
            <CardDescription>
              {isForgot
                ? 'Enter your email to receive a reset link'
                : 'Sign in to your account or get started'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* ── Forgot password view ── */}
            {isForgot ? (
              <div className="space-y-4">
                {forgotSent ? (
                  <div className="text-center py-4 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                      <Check className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Reset link sent! Check your inbox and follow the instructions.
                    </p>
                    <Button variant="outline" className="w-full" onClick={() => { setIsForgot(false); setForgotSent(false); }}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={forgotForm.handleSubmit(onForgot)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email">Email</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="you@example.com"
                        {...forgotForm.register('email')}
                      />
                      {forgotForm.formState.errors.email && (
                        <p className="text-sm text-destructive">{forgotForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                      Send reset link
                    </Button>
                    <Button type="button" variant="ghost" className="w-full" onClick={() => setIsForgot(false)}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
                    </Button>
                  </form>
                )}
              </div>
            ) : (
              /* ── Main tabs ── */
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                {/* ── Login tab ── */}
                <TabsContent value="login">
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        {...loginForm.register('email')}
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <button
                          type="button"
                          onClick={() => setIsForgot(true)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          {...loginForm.register('password')}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</> : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>

                {/* ── Sign up tab ── */}
                <TabsContent value="signup">

                  {/* Choice screen */}
                  {signupMode === null && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground text-center mb-4">
                        How do you want to use PourStock?
                      </p>

                      {/* Create hotel card */}
                      <button
                        type="button"
                        onClick={() => setSignupMode('create')}
                        className="w-full text-left rounded-xl border border-border/60 bg-card/50 hover:border-primary/60 hover:bg-primary/5 p-4 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                            <Hotel className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Register your hotel</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Set up a new hotel on PourStock. You'll be the hotel admin.
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Join hotel card */}
                      <button
                        type="button"
                        onClick={() => setSignupMode('join')}
                        className="w-full text-left rounded-xl border border-border/60 bg-card/50 hover:border-border hover:bg-muted/30 p-4 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 group-hover:bg-muted transition-colors">
                            <UserPlus className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Join an existing hotel</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              You work at a hotel already using PourStock. A manager will approve you.
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Signup form — shared for both modes */}
                  {signupMode !== null && (
                    <div className="space-y-4">
                      <button
                        type="button"
                        onClick={() => setSignupMode(null)}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" /> Back
                      </button>

                      {/* Mode badge */}
                      <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
                        {signupMode === 'create'
                          ? <Hotel className="h-4 w-4 text-primary flex-shrink-0" />
                          : <UserPlus className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        <span className="text-xs text-muted-foreground">
                          {signupMode === 'create'
                            ? 'Registering a new hotel — hotel setup continues after email verification.'
                            : 'Joining a hotel — a manager will approve your account.'}
                        </span>
                      </div>

                      <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-name">Full Name</Label>
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="Your name"
                            {...signupForm.register('fullName')}
                          />
                          {signupForm.formState.errors.fullName && (
                            <p className="text-sm text-destructive">{signupForm.formState.errors.fullName.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="you@example.com"
                            {...signupForm.register('email')}
                          />
                          {signupForm.formState.errors.email && (
                            <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <div className="relative">
                            <Input
                              id="signup-password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Min. 8 characters"
                              {...signupForm.register('password')}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          {signupForm.formState.errors.password && (
                            <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-confirm">Confirm Password</Label>
                          <Input
                            id="signup-confirm"
                            type="password"
                            placeholder="••••••••"
                            {...signupForm.register('confirmPassword')}
                          />
                          {signupForm.formState.errors.confirmPassword && (
                            <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                          )}
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading
                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account…</>
                            : signupMode === 'create'
                              ? 'Create Account & Continue'
                              : 'Create Account'}
                        </Button>
                      </form>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in, you agree to our{' '}
          <a href="/terms" className="underline underline-offset-2 hover:text-foreground">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
