import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('Teacher' | 'Student')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, checkingSession } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 animate-pulse font-heading text-sm font-medium tracking-tight text-muted-foreground">
            Verifying secure session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user attempts to enter an unauthorized role area, route them to their correct role area
    const defaultRedirect = user.role === 'Teacher' ? '/teacher' : '/student';
    return <Navigate to={defaultRedirect} replace />;
  }

  return <>{children}</>;
}
