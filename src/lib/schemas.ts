/**
 * Centralised Zod v4 validation schemas for all API request bodies.
 * Zod v4 API changes from v3:
 *  - z.string({ required_error }) → removed; use .min(1, 'message') instead
 *  - ZodError.issues is the canonical array (was .errors in v3)
 *
 * Usage:
 *   const parsed = RegisterSchema.safeParse(body);
 *   if (!parsed.success) return validationError(parsed.error);
 */
import { z, ZodError } from 'zod';
import { NextResponse } from 'next/server';

// ─── Helper: produce a consistent 400 validation error response ──────────────

export function validationError(err: ZodError): NextResponse {
  const issues = err.issues ?? [];
  return NextResponse.json(
    {
      success: false,
      error: {
        message: issues[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: issues.map((e) => ({
          field: e.path.map(String).join('.'),
          message: e.message,
        })),
      },
    },
    { status: 400 }
  );
}

// ─── Reusable field validators ───────────────────────────────────────────────

const PasswordRule = z
  .string()
  .min(1, 'Password is required')
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character');

// ─── Auth schemas ─────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, "Full name may only contain letters, spaces, hyphens, and apostrophes"),
  email: z
    .string()
    .min(1, 'Email is required')
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address')
    .max(254, 'Email must not exceed 254 characters'),
  password: PasswordRule,
});

export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export const VerifyOtpSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  otp: z
    .string()
    .min(1, 'OTP is required')
    .trim()
    .min(4, 'OTP must be at least 4 characters')
    .max(8, 'OTP must not exceed 8 characters')
    .regex(/^\d+$/, 'OTP must contain only digits'),
});

export const VerifyEmailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
});

export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: PasswordRule,
});

// ─── Trip schemas ─────────────────────────────────────────────────────────────

const PlaceSchema = z.object({
  name: z.string().trim().max(150).optional(),
  description: z.string().trim().max(500).optional(),
  isSelected: z.boolean().optional(),
}).passthrough();

export const TripCreateSchema = z.object({
  destination: z
    .string()
    .min(1, 'Destination is required')
    .trim()
    .max(100, 'Destination must be at most 100 characters'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  places: z
    .array(PlaceSchema)
    .min(1, 'At least one place is required')
    .max(50, 'A trip can have at most 50 places'),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end;
  },
  { message: 'End date must be after or equal to start date', path: ['endDate'] }
);

export const CompleteTaskSchema = z.object({
  placeIndex: z
    .number({ error: 'placeIndex must be a number' })
    .int('placeIndex must be an integer')
    .nonnegative('placeIndex must be non-negative'),
});

// ─── AI Trip Generation schemas ───────────────────────────────────────────────

export const AiTripRequestSchema = z.object({
  destination: z
    .string()
    .min(1, 'Destination is required')
    .trim()
    .max(100, 'Destination must be between 1 and 100 characters'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end;
  },
  { message: 'End date must be after or equal to start date', path: ['endDate'] }
);

// ─── Profile schema ───────────────────────────────────────────────────────────

export const ProfileUpdateSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, "Full name may only contain letters, spaces, hyphens, and apostrophes"),
  email: z
    .string()
    .min(1, 'Email is required')
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  bio: z.string().trim().max(300, 'Bio must not exceed 300 characters').optional().default(''),
  isTripPublic: z.boolean().optional(),
});
