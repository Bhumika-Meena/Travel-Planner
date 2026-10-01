'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const codeParam = searchParams.get('code');

  const [otp, setOtp] = useState(codeParam || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="auth-shell">
        <div className="auth-card text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Invalid Verification Link
          </h2>
          <p className="text-sm text-slate-500">
            Please use the verification link sent to your email or try signing in.
          </p>
          <div className="pt-2">
            <Link href="/login" className="btn-primary inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            Verify Your Email
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            We&apos;ve sent a 6-digit verification code to <span className="font-semibold text-slate-700">{email}</span>
          </p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleVerify}>
          {error && (
            <div className="alert-error flex items-center gap-2" role="alert">
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert-success flex items-center gap-2" role="alert">
              <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Email verified successfully! Redirecting to login...</span>
            </div>
          )}

          <div>
            {codeParam && (
              <div className="mb-3 text-xs bg-sky-50 text-sky-800 p-2.5 rounded-xl border border-sky-200 text-center font-medium">
                💡 Verification code ({codeParam}) prefilled for testing! Click verify below.
              </div>
            )}
            <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-1.5 text-center">
              6-Digit Code
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              required
              className="input-field text-center font-mono text-xl tracking-[0.3em] font-semibold"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={loading}
              maxLength={6}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Didn&apos;t receive it?</span>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendLoading}
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
            >
              {resendLoading ? 'Resending code...' : 'Resend Code'}
            </button>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                'Verify Email'
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

