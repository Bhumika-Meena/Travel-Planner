'use client';

import { useState } from 'react';
import Link from 'next/link';
import { validateLoginEmail } from '@/utils/loginValidation';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate email
    const emailValidation = validateLoginEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || '');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-5 group">
            <div className="brand-mark w-10 h-10 text-lg group-hover:bg-blue-700 transition-colors">✈</div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Travel<span className="text-blue-600">Planner</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Reset password
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Enter your email address and we&apos;ll send you instructions to reset your password.
          </p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              className="input-field"
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            {error && (
              <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1">
                <span>•</span> {error}
              </p>
            )}
          </div>

          {success && (
            <div className="alert-success flex items-center gap-2" role="alert">
              <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>If an account exists with this email, password reset instructions have been sent.</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                  <span>Sending instructions...</span>
                </div>
              ) : (
                'Send reset instructions'
              )}
            </button>
          </div>

          <div className="text-center pt-2">
            <Link href="/login" className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 