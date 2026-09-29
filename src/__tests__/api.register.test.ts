/**
 * Integration tests for POST /api/auth/register.
 * MongoDB and email are mocked so tests run offline and quickly.
 */

import { jest, describe, beforeEach, it, expect } from '@jest/globals';

// ── Module mocks ─────────────────────────────────────────────────────────────

const mockFindOne = jest.fn();
const mockInsertOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockCollection = jest.fn(() => ({
  findOne: mockFindOne,
  insertOne: mockInsertOne,
  updateOne: mockUpdateOne,
}));

jest.unstable_mockModule('@/lib/mongodb', () => ({
  connectToDatabase: jest.fn(() =>
    Promise.resolve({ db: { collection: mockCollection }, client: {} })
  ),
}));

jest.unstable_mockModule('@/utils/email', () => ({
  sendVerificationEmail: jest.fn(() => Promise.resolve()),
  generateOTP: jest.fn(() => '123456'),
}));

jest.unstable_mockModule('@/lib/env', () => ({
  validateEnvironment: jest.fn(() => ({ valid: true, errors: [], warnings: [] })),
}));

// ── Dynamic imports after mocking ────────────────────────────────────────────

const { POST } = await import('@/app/api/auth/register/route');

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>, ip?: string): Request {
  const clientIp = ip ?? `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': clientIp },
    body: JSON.stringify(body),
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindOne.mockResolvedValue(null);
    mockInsertOne.mockResolvedValue({ insertedId: 'newUserId' });
    mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });
  });

  it('returns 201 for a valid new registration', async () => {
    const res = await POST(makeRequest({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: 'SecureP@ss1',
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.message).toMatch(/verification/i);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(makeRequest({ email: 'jane@example.com' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is too weak', async () => {
    const res = await POST(makeRequest({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: 'weak',
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    // Zod catches short password first → structured error; validatePassword catches complexity
    expect(body.error?.message ?? body.message).toBeTruthy();
  });

  it('returns 400 for a password without special character', async () => {
    const res = await POST(makeRequest({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: 'NoSpecial1',
    }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is already registered and verified', async () => {
    mockFindOne.mockResolvedValue({ _id: 'existing', isVerified: true });
    const res = await POST(makeRequest({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: 'SecureP@ss1',
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/already registered/i);
  });

  it('resends verification when email exists but is not verified', async () => {
    mockFindOne.mockResolvedValue({ _id: 'existing', isVerified: false });
    const res = await POST(makeRequest({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: 'SecureP@ss1',
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toMatch(/verification/i);
  });

  it('does not include devOtp in non-development environment', async () => {
    const res = await POST(makeRequest({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: 'SecureP@ss1',
    }));
    const body = await res.json();
    expect(body.devOtp).toBeUndefined();
  });

  it('returns 429 when rate limit is exceeded', async () => {
    const fixedIp = '192.168.77.1';
    const requests = Array.from({ length: 6 }, () =>
      POST(makeRequest({
        fullName: 'Jane Doe',
        email: `jane${Math.random()}@example.com`,
        password: 'SecureP@ss1',
      }, fixedIp))
    );
    const responses = await Promise.all(requests);
    const statuses = responses.map((r) => r.status);
    expect(statuses).toContain(429);
  });
});
