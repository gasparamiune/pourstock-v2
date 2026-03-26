import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, UserPlus, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

interface InviteInfo {
  hotel_id: string;
  hotel_name?: string;
  hotel_role: string;
  department?: string;
  email?: string;
  expires_at: string;
}

export default function Join() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signUp } = useAuth();
  const token = searchParams.get('token');

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setInviteError('No invite token provided. Please use the link sent to you.');
      setLoading(false);
      return;
    }

    async function validateToken() {
      const { data, error } = await (supabase as any)
        .from('hotel_invites')
        .select('hotel_id, hotel_role, department, email, expires_at')
        .eq('token', token as string)
        .is('used_at', null)
        .single();

      if (error || !data) {
        setInviteError('This invite link is invalid or has already been used.');
        setLoading(false);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setInviteError('This invite link has expired. Please ask for a new one.');
        setLoading(false);
        return;
      }

      // Fetch hotel name
      const { data: hotel } = await supabase
        .from('hotels')
        .select('name')
        .eq('id', data.hotel_id)
        .single();

      setInvite({ ...data, hotel_name: hotel?.name });
      if (data.email) {
        form.setValue('email', data.email);
      }
      setLoading(false);
    }

    validateToken();
  }, [token]);

  const onSubmit = async (formData: FormData) => {
    if (!invite || !token) return;
    setSubmitting(true);
    try {
      const { error } = await signUp(formData.email, formData.password, formData.fullName);
      if (error) {
        throw new Error(
          error.message.includes('already registered')
            ? 'This email is already registered. Please sign in instead.'
            : error.message
        );
      }
      // Store the invite token so the backend can use it after email verification
      sessionStorage.setItem('pendingInviteToken', token);
      toast.success('Account created! Check your email to verify, then sign in.');
      navigate('/auth');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (inviteError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full glass-card border-border/50">
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="font-semibold text-lg">Invalid Invite</h2>
            <p className="text-sm text-muted-foreground">{inviteError}</p>
            <Button variant="outline" onClick={() => navigate('/auth')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">You've been invited</h1>
          {invite?.hotel_name && (
            <p className="text-muted-foreground mt-1">
              Join <strong>{invite.hotel_name}</strong> on PourStock
            </p>
          )}
        </div>

        <Card className="glass-card border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Create your account</CardTitle>
            <CardDescription>
              Role: <strong className="capitalize">{invite?.hotel_role ?? 'staff'}</strong>
              {invite?.department && <> · Department: <strong className="capitalize">{invite.department}</strong></>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="Your name" {...form.register('fullName')} />
                {form.formState.errors.fullName && (
                  <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  readOnly={!!invite?.email}
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    {...form.register('password')}
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
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input type="password" placeholder="••••••••" {...form.register('confirmPassword')} />
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {submitting ? 'Creating account…' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          A manager will approve your account before you can access the hotel.
        </p>
      </div>
    </div>
  );
}
