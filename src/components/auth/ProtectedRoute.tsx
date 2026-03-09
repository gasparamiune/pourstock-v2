import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireManager?: boolean;
  requireDepartment?: 'reception' | 'housekeeping' | 'restaurant';
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireManager = false,
  requireDepartment,
}: ProtectedRouteProps) {
  const { user, loading, isAdmin, isManager, profile, hasDepartment, hotelMemberships } = useAuth();
  const location = useLocation();
  const isOnboarding = location.pathname === '/onboarding';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (requireManager && !isManager) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You need manager privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (requireDepartment && !hasDepartment(requireDepartment)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You don't have access to the {requireDepartment} department.</p>
        </div>
      </div>
    );
  }

  // Approval gate: unapproved users see a pending screen (admins bypass)
  if (!isAdmin && profile && !profile.is_approved) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold">Account Pending Approval</h1>
          <p className="text-muted-foreground mt-2">
            Your account has been created but is waiting for approval from a manager or administrator. You'll be able to access the app once approved.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
