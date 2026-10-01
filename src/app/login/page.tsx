'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { validateLoginEmail, validateLoginPassword } from '@/utils/loginValidation';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // If user is already authenticated via JWT session, redirect to dashboard
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate email
    const emailValidation = validateLoginEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error || '';
    }

    // Validate password
    const passwordValidation = validateLoginPassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.error || '';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setErrors({});
    setLoading(true);
    setSuccess(false);
    setShowVerificationMessage(false);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.message === 'Email not verified') {
          setShowVerificationMessage(true);
          // Send verification email
          const verifyResponse = await fetch('/api/auth/verify-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: formData.email.trim().toLowerCase(),
            }),
          });

          if (!verifyResponse.ok) {
            throw new Error('Failed to send verification email');
          }

          router.push(`/verify-email?email=${encodeURIComponent(formData.email.trim().toLowerCase())}`);
          return;
        }
        throw new Error(data.message || 'Failed to login');
      }

      // Refresh authentication state via verified session
      await refreshUser();
      setSuccess(true);
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (err: any) {
      console.error('Login error:', err);
      setErrors({ submit: err.message || 'Failed to login' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 group mb-5">
            <div className="brand-mark w-10 h-10 text-lg group-hover:bg-blue-700 transition-colors">
              ✈
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Travel<span className="text-blue-600">Planner</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Sign in to your itineraries, messages, and rankings.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
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
              placeholder="e.g., explorer@example.com"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.email}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="form-label mb-0">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                minLength={8}
                maxLength={128}
                className="input-field pr-10"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.password}</p>
            )}
          </div>

          {errors.submit && (
            <div className="alert-error">
              {errors.submit}
            </div>
          )}

          {showVerificationMessage && (
            <div className="alert-warn">
              Please verify your email address. A verification code has been sent to your email.
            </div>
          )}

          {success && (
            <div className="alert-success">
              Login successful! Redirecting to dashboard...
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Signing in...</span>
              </div>
            ) : (
              'Sign In'
            )}
          </button>

          <p className="text-center text-sm text-slate-500 pt-2">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
              Create one free
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
} 