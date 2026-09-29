/**
 * Unit tests for password and field validation utilities.
 * Pure functions – no DB or network calls.
 */
import { validatePassword, validateEmail, validateName } from '@/utils/validation';

// ─────────────────────────── validatePassword ───────────────────────────────

describe('validatePassword', () => {
  it('rejects empty password', () => {
    expect(validatePassword('').isValid).toBe(false);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = validatePassword('Abc1!');
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/8/);
  });

  it('rejects password without uppercase', () => {
    const result = validatePassword('abcdef1!');
    expect(result.isValid).toBe(false);
  });

  it('rejects password without lowercase', () => {
    const result = validatePassword('ABCDEF1!');
    expect(result.isValid).toBe(false);
  });

  it('rejects password without a number', () => {
    const result = validatePassword('Abcdefg!');
    expect(result.isValid).toBe(false);
  });

  it('rejects password without a special character', () => {
    const result = validatePassword('Abcdef12');
    expect(result.isValid).toBe(false);
  });

  it('rejects common passwords like "password"', () => {
    const result = validatePassword('password');
    expect(result.isValid).toBe(false);
  });

  it('accepts a strong valid password', () => {
    const result = validatePassword('SecureP@ss1');
    expect(result.isValid).toBe(true);
    expect(result.strength).toBe(4);
  });

  it('rejects passwords exceeding 128 characters', () => {
    const result = validatePassword('A1a!' + 'x'.repeat(130));
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/128/);
  });
});

// ─────────────────────────── validateEmail ──────────────────────────────────

describe('validateEmail', () => {
  it('rejects empty email', () => {
    expect(validateEmail('').isValid).toBe(false);
  });

  it('rejects malformed email (no @)', () => {
    expect(validateEmail('notanemail').isValid).toBe(false);
  });

  it('rejects malformed email (no domain)', () => {
    expect(validateEmail('user@').isValid).toBe(false);
  });

  it('accepts a valid email', () => {
    expect(validateEmail('user@example.com').isValid).toBe(true);
  });

  it('accepts email with subdomains', () => {
    expect(validateEmail('user@mail.example.co.uk').isValid).toBe(true);
  });

  it('rejects email longer than 254 characters', () => {
    const longEmail = 'a'.repeat(250) + '@b.co';
    expect(validateEmail(longEmail).isValid).toBe(false);
  });
});

// ─────────────────────────── validateName ───────────────────────────────────

describe('validateName', () => {
  it('rejects empty name', () => {
    expect(validateName('').isValid).toBe(false);
  });

  it('rejects name shorter than 2 characters', () => {
    expect(validateName('A').isValid).toBe(false);
  });

  it('rejects name with numbers', () => {
    expect(validateName('John123').isValid).toBe(false);
  });

  it('accepts a valid name with hyphen', () => {
    expect(validateName('Jean-Pierre').isValid).toBe(true);
  });

  it('accepts a valid name with apostrophe', () => {
    expect(validateName("O'Brien").isValid).toBe(true);
  });
});

// ─────────────────────────── Zod Schemas ────────────────────────────────────

import {
  RegisterSchema,
  LoginSchema,
  VerifyOtpSchema,
  VerifyEmailSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  TripCreateSchema,
  CompleteTaskSchema,
  AiTripRequestSchema,
  ProfileUpdateSchema,
} from '@/lib/schemas';

describe('Zod Auth & Reset Schemas', () => {
  it('ForgotPasswordSchema validates correct email and trims it', () => {
    const res = ForgotPasswordSchema.safeParse({ email: '  Test@Example.com ' });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.email).toBe('test@example.com');
    }
  });

  it('ForgotPasswordSchema rejects invalid email', () => {
    const res = ForgotPasswordSchema.safeParse({ email: 'invalid-email' });
    expect(res.success).toBe(false);
  });

  it('ResetPasswordSchema validates token and strong password', () => {
    const res = ResetPasswordSchema.safeParse({
      token: 'valid-reset-token-123',
      password: 'StrongPassword1!',
    });
    expect(res.success).toBe(true);
  });

  it('ResetPasswordSchema rejects weak password', () => {
    const res = ResetPasswordSchema.safeParse({
      token: 'valid-token',
      password: 'weak',
    });
    expect(res.success).toBe(false);
  });

  it('VerifyOtpSchema requires digits and length between 4 and 8', () => {
    expect(VerifyOtpSchema.safeParse({ email: 'a@b.com', otp: '123456' }).success).toBe(true);
    expect(VerifyOtpSchema.safeParse({ email: 'a@b.com', otp: '12' }).success).toBe(false); // too short
    expect(VerifyOtpSchema.safeParse({ email: 'a@b.com', otp: '123456789' }).success).toBe(false); // too long
    expect(VerifyOtpSchema.safeParse({ email: 'a@b.com', otp: '1234ab' }).success).toBe(false); // not digits
  });

  it('VerifyEmailSchema validates email', () => {
    expect(VerifyEmailSchema.safeParse({ email: 'valid@domain.com' }).success).toBe(true);
    expect(VerifyEmailSchema.safeParse({ email: '' }).success).toBe(false);
  });
});

describe('Zod AI & Trip Schemas', () => {
  it('AiTripRequestSchema accepts valid parameters', () => {
    const res = AiTripRequestSchema.safeParse({
      destination: 'Tokyo',
      startDate: '2026-10-01',
      endDate: '2026-10-05',
    });
    expect(res.success).toBe(true);
  });

  it('AiTripRequestSchema rejects endDate before startDate', () => {
    const res = AiTripRequestSchema.safeParse({
      destination: 'Tokyo',
      startDate: '2026-10-10',
      endDate: '2026-10-05',
    });
    expect(res.success).toBe(false);
  });

  it('AiTripRequestSchema rejects destination exceeding 100 characters', () => {
    const res = AiTripRequestSchema.safeParse({
      destination: 'A'.repeat(101),
      startDate: '2026-10-01',
      endDate: '2026-10-05',
    });
    expect(res.success).toBe(false);
  });

  it('TripCreateSchema rejects empty places array or more than 50 places', () => {
    expect(TripCreateSchema.safeParse({
      destination: 'Rome',
      startDate: '2026-10-01',
      endDate: '2026-10-05',
      places: [],
    }).success).toBe(false);

    const places51 = Array.from({ length: 51 }, (_, i) => ({ name: `Place ${i}` }));
    expect(TripCreateSchema.safeParse({
      destination: 'Rome',
      startDate: '2026-10-01',
      endDate: '2026-10-05',
      places: places51,
    }).success).toBe(false);
  });

  it('CompleteTaskSchema rejects non-integers and negative numbers', () => {
    expect(CompleteTaskSchema.safeParse({ placeIndex: 0 }).success).toBe(true);
    expect(CompleteTaskSchema.safeParse({ placeIndex: -1 }).success).toBe(false);
    expect(CompleteTaskSchema.safeParse({ placeIndex: 1.5 }).success).toBe(false);
    expect(CompleteTaskSchema.safeParse({ placeIndex: '0' }).success).toBe(false);
  });
});

describe('Zod ProfileUpdateSchema', () => {
  it('accepts valid profile updates', () => {
    const res = ProfileUpdateSchema.safeParse({
      fullName: 'Alice Smith',
      email: 'alice@example.com',
      bio: 'Loves mountains',
      isTripPublic: true,
    });
    expect(res.success).toBe(true);
  });

  it('rejects invalid names or emails', () => {
    expect(ProfileUpdateSchema.safeParse({
      fullName: 'A',
      email: 'alice@example.com',
    }).success).toBe(false);

    expect(ProfileUpdateSchema.safeParse({
      fullName: 'Alice Smith',
      email: 'not-an-email',
    }).success).toBe(false);
  });
});

