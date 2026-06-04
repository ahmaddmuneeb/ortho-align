import { Navigate, Outlet } from 'react-router-dom';
import { Skeleton } from './ui/Skeleton';
import { useAppSelector } from '../store/hooks';
import type { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  roles?: UserRole[];
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user, token, loading } = useAppSelector((s) => s.auth);

  if (loading) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-3"
        aria-busy="true"
        aria-label="Loading session"
      >
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
