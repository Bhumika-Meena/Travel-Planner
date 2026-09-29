/**
 * Unit tests for JWT auth helpers (signAuthToken, verifyAuthToken, getAuthSession).
 * These tests run against the Node.js runtime and use real jose operations.
 * A test JWT_SECRET is set via environment variable before each test.
 */

// Inject a valid test secret BEFORE importing auth (module-level env check runs at import time)
process.env.JWT_SECRET = 'test-secret-that-is-definitely-32-chars-long!!';
process.env.NODE_ENV = 'test';

import { signAuthToken, verifyAuthToken, getAuthSession, UserSessionPayload } from '@/lib/auth';

const SAMPLE_PAYLOAD: UserSessionPayload = {
  userId: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  fullName: 'Test User',
};

// ─────────────────────────── signAuthToken ──────────────────────────────────

describe('signAuthToken', () => {
  it('produces a non-empty JWT string', async () => {
    const token = await signAuthToken(SAMPLE_PAYLOAD);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // header.payload.signature
  });

  it('encodes all payload fields in the token', async () => {
    const token = await signAuthToken(SAMPLE_PAYLOAD);
    // Decode the payload section (middle segment) without verification
    const payloadB64 = token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    expect(decoded.userId).toBe(SAMPLE_PAYLOAD.userId);
    expect(decoded.email).toBe(SAMPLE_PAYLOAD.email);
    expect(decoded.fullName).toBe(SAMPLE_PAYLOAD.fullName);
    // Expiry (exp) should be approximately 7 days from now
    const sevenDaysSeconds = 7 * 24 * 60 * 60;
    expect(decoded.exp - decoded.iat).toBeCloseTo(sevenDaysSeconds, -1);
  });
});

// ─────────────────────────── verifyAuthToken ────────────────────────────────

describe('verifyAuthToken', () => {
  it('verifies a valid token and returns the original payload', async () => {
    const token = await signAuthToken(SAMPLE_PAYLOAD);
    const result = await verifyAuthToken(token);
    expect(result).not.toBeNull();
    expect(result?.userId).toBe(SAMPLE_PAYLOAD.userId);
    expect(result?.email).toBe(SAMPLE_PAYLOAD.email);
    expect(result?.fullName).toBe(SAMPLE_PAYLOAD.fullName);
  });

  it('returns null for a tampered token', async () => {
    const token = await signAuthToken(SAMPLE_PAYLOAD);
    const tampered = token.slice(0, -4) + 'XXXX';
    expect(await verifyAuthToken(tampered)).toBeNull();
  });

  it('returns null for a random string', async () => {
    expect(await verifyAuthToken('not.a.jwt')).toBeNull();
  });

  it('returns null for an empty string', async () => {
    expect(await verifyAuthToken('')).toBeNull();
  });
});

// ─────────────────────────── getAuthSession ─────────────────────────────────

describe('getAuthSession', () => {
  it('extracts session from Authorization: Bearer header', async () => {
    const token = await signAuthToken(SAMPLE_PAYLOAD);
    const req = new Request('http://localhost/api/test', {
      headers: { authorization: `Bearer ${token}` },
    });
    const session = await getAuthSession(req);
    expect(session?.userId).toBe(SAMPLE_PAYLOAD.userId);
    expect(session?.email).toBe(SAMPLE_PAYLOAD.email);
  });

  it('extracts session from Cookie header', async () => {
    const token = await signAuthToken(SAMPLE_PAYLOAD);
    const req = new Request('http://localhost/api/test', {
      headers: { cookie: `auth_token=${token}` },
    });
    const session = await getAuthSession(req);
    expect(session?.userId).toBe(SAMPLE_PAYLOAD.userId);
  });

  it('returns null when no auth token is present', async () => {
    const req = new Request('http://localhost/api/test');
    expect(await getAuthSession(req)).toBeNull();
  });

  it('returns null for an invalid token in Bearer header', async () => {
    const req = new Request('http://localhost/api/test', {
      headers: { authorization: 'Bearer invalid.token.here' },
    });
    expect(await getAuthSession(req)).toBeNull();
  });
});
