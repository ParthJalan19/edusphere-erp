import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../shared/services/apiClient.js';
import { Mail, Loader2, ArrowLeft, GraduationCap } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [demoToken, setDemoToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    setDemoToken('');

    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      setMessage(response.data.data.message);

      // Capture the mock token returned by backend for demo purposes
      if (response.data.data.token) {
        setDemoToken(response.data.data.token);
      }
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: { message?: string } } };
        message?: string;
      };
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          'Something went wrong. Please try again.'
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
          Reset password
        </h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">
          Enter your institutional email address and we&apos;ll generate a secure reset link.
        </p>

        {error && (
          <div className="mb-4 rounded-md border border-danger/25 bg-danger/10 p-3 text-xs font-medium text-danger">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-md border border-success/25 bg-success/10 p-3 text-xs font-medium text-success">
            {message}
          </div>
        )}

        {/* Demo Assistant Reset Link */}
        {demoToken && (
          <div className="mb-6 rounded-md border border-accent/25 bg-accent/10 p-4 text-xs">
            <span className="mb-1 block font-heading font-bold text-foreground">
              [Demo Mode] Reset URL Generated:
            </span>
            <p className="mb-3 font-sans text-muted-foreground">
              No SMTP email server is required in v1. Click the button below to directly navigate to
              the password reset page:
            </p>
            <Link
              to={`/reset-password/${demoToken}`}
              className="inline-flex items-center justify-center rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground shadow-sm transition duration-150 hover:bg-accent/95"
            >
              Reset Password Now
            </Link>
          </div>
        )}

        {!demoToken && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@edusphere.edu"
                  disabled={loading}
                  className="block w-full rounded-md border border-border bg-card py-2 pl-10 pr-3 text-sm transition duration-150 placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
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
                  Generating link...
                </>
              ) : (
                'Generate Reset Link'
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
