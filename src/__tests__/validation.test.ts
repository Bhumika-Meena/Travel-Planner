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

  it('rejects name exceeding 50 characters', () => {
    const longName = 'A'.repeat(51);
    expect(validateName(longName).isValid).toBe(false);
  });
});
