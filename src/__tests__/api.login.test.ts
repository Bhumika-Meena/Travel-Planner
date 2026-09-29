/**
 * Integration tests for POST /api/auth/login.
 * MongoDB is mocked; bcrypt runs in test mode.
 */

import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import bcrypt from 'bcryptjs';

// ── Module mocks (must be called before imports that use them) ───────────────

const mockFindOne = jest.fn();
const mockCollection = jest.fn(() => ({ findOne: mockFindOne }));

jest.unstable_mockModule('@/lib/mongodb', () => ({
  connectToDatabase: jest.fn(() =>
    Promise.resolve({ db: { collection: mockCollection }, client: {} })
  ),
}));

jest.unstable_mockModule('@/lib/env', () => ({
  validateEnvironment: jest.fn(() => ({ valid: true, errors: [], warnings: [] })),
}));

// ── Dynamic imports after mocking ────────────────────────────────────────────

const { POST } = await import('@/app/api/auth/login/route');

const HASHED_PASSWORD = bcrypt.hashSync('SecureP@ss1', 1); // rounds=1 for speed

const VERIFIED_USER = {
  _id: { toString: () => 'user123' },
  email: 'jane@example.com',
  fullName: 'Jane Doe',
  password: HASHED_PASSWORD,
  isVerified: true,
};

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.1' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 and sets auth cookie on valid credentials', async () => {
    mockFindOne.mockResolvedValue(VERIFIED_USER);
    const res = await POST(makeRequest({ email: 'jane@example.com', password: 'SecureP@ss1' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeDefined();
    expect(JSON.stringify(body)).not.toContain(HASHED_PASSWORD);
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toMatch(/auth_token/);
  });

  it('returns 400 when email or password is missing', async () => {
    const res = await POST(makeRequest({ email: 'jane@example.com' }));
    expect(res.status).toBe(400);
  });

  it('returns 401 for a non-existent user', async () => {
    mockFindOne.mockResolvedValue(null);
    const res = await POST(makeRequest({ email: 'ghost@example.com', password: 'SecureP@ss1' }));
    expect(res.status).toBe(401);
  });

  it('returns 401 for an unverified user', async () => {
    mockFindOne.mockResolvedValue({ ...VERIFIED_USER, isVerified: false });
    const res = await POST(makeRequest({ email: 'jane@example.com', password: 'SecureP@ss1' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toMatch(/not verified/i);
  });

  it('returns 401 for an incorrect password', async () => {
    mockFindOne.mockResolvedValue(VERIFIED_USER);
    const res = await POST(makeRequest({ email: 'jane@example.com', password: 'WrongPass1!' }));
    expect(res.status).toBe(401);
  });

  it('response body does not leak password, resetToken or resetTokenExpiry', async () => {
    mockFindOne.mockResolvedValue({
      ...VERIFIED_USER,
      resetToken: 'secret-reset',
      resetTokenExpiry: new Date(),
    });
    const res = await POST(makeRequest({ email: 'jane@example.com', password: 'SecureP@ss1' }));
    const body = await res.json();
    const serialised = JSON.stringify(body);
    expect(serialised).not.toContain('secret-reset');
    expect(serialised).not.toContain('resetToken');
    expect(serialised).not.toContain('password');
  });
});
