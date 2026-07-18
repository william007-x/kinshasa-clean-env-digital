import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import type { UserRole } from '../lib/supabase';
import { LoadingState } from './ui';

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingState message="Vérification de l'accès…" />;

  if (!user) {
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  }

  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
