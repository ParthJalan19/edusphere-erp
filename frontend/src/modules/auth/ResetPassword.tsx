import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../shared/services/apiClient.js';
import { useAppDispatch } from '../../shared/hooks/redux.js';
import { checkAuthSession } from '../../shared/services/authSlice.js';
import { Lock, Eye, EyeOff, Loader2, ArrowLeft, GraduationCap } from 'lucide-react';

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      await apiClient.post(`/auth/reset-password/${token}`, {
        password,
        confirmPassword,
      });

      setSuccess(true);

      // Dispatch checking session to fetch user details and set authenticated state
      await dispatch(checkAuthSession());

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: { message?: string } } };
        message?: string;
      };
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to reset password. Token may be invalid or expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
        {/* Logo Header */}
        <div className="mb-6 flex items-center gap-2">
          <div className="rounded-lg bg-primary p-1.5">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight">EduSphere ERP</span>
        </div>

        <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
          Enter new password
        </h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">
          Please secure your account with a strong, custom password.
        </p>

        {error && (
          <div className="mb-4 rounded-md border border-danger/25 bg-danger/10 p-3 text-xs font-medium text-danger">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md border border-success/25 bg-success/10 p-3 text-xs font-medium text-success">
            Password reset successfully! Logging you in and redirecting...
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground"
              >
                New Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="block w-full rounded-md border border-border bg-card py-2 pl-10 pr-10 text-sm transition duration-150 placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="block w-full rounded-md border border-border bg-card py-2 pl-10 pr-10 text-sm transition duration-150 placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition duration-150 hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}

        <div className="mt-6 border-t border-border pt-4 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
