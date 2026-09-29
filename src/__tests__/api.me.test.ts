/**
 * Integration tests for GET /api/auth/me.
 * Verifies authenticated retrieval, unauthenticated handling, and sensitive data projection.
 */

import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { ObjectId } from 'mongodb';

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

const { signAuthToken } = await import('@/lib/auth');
const { GET } = await import('@/app/api/auth/me/route');

const TEST_USER_ID = new ObjectId().toString();

const DB_USER = {
  _id: new ObjectId(TEST_USER_ID),
  fullName: 'Explorer Jane',
  email: 'jane@example.com',
  points: 150,
  level: 2,
  badges: ['FIRST_TRIP'],
  profilePicture: 'https://example.com/avatar.jpg',
  bio: 'Loves backpacking',
  totalTrips: 3,
  isVerified: true,
  isTripPublic: false,
};

async function makeAuthRequest(cookieValue?: string, headerAuth?: string): Promise<Request> {
  const headers: Record<string, string> = {};
  if (cookieValue) headers['cookie'] = `auth_token=${cookieValue}`;
  if (headerAuth) headers['authorization'] = `Bearer ${headerAuth}`;
  return new Request('http://localhost/api/auth/me', {
    method: 'GET',
    headers,
  });
}

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns { user: null } with status 200 when unauthenticated', async () => {
    const req = await makeAuthRequest();
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ user: null });
  });

  it('returns { user: null } when token is malformed', async () => {
    const req = await makeAuthRequest('invalid.token.signature');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ user: null });
  });

  it('returns { user: null } when user id in token is not found in database', async () => {
    mockFindOne.mockResolvedValue(null);
    const token = await signAuthToken({ userId: TEST_USER_ID, email: 'jane@example.com', fullName: 'Jane' });
    const req = await makeAuthRequest(token);
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ user: null });
  });

  it('returns authenticated user details when valid token provided', async () => {
    mockFindOne.mockResolvedValue(DB_USER);
    const token = await signAuthToken({ userId: TEST_USER_ID, email: 'jane@example.com', fullName: 'Explorer Jane' });
    const req = await makeAuthRequest(token);
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeDefined();
    expect(body.user._id).toBe(TEST_USER_ID);
    expect(body.user.email).toBe('jane@example.com');
    expect(body.user.fullName).toBe('Explorer Jane');
    expect(body.user.points).toBe(150);
    expect(body.user.badges).toEqual(['FIRST_TRIP']);
    expect(body.user.isTripPublic).toBe(false);
  });

  it('never exposes password, resetToken, or resetTokenExpiry', async () => {
    mockFindOne.mockResolvedValue({
      ...DB_USER,
      password: '$2a$10$hashedpasswordthatshouldneverleak',
      resetToken: 'secretresettoken',
      resetTokenExpiry: new Date(),
    });
    const token = await signAuthToken({ userId: TEST_USER_ID, email: 'jane@example.com', fullName: 'Jane' });
    const req = await makeAuthRequest(token);
    const res = await GET(req);
    const body = await res.json();
    const str = JSON.stringify(body);
    expect(str).not.toContain('hashedpassword');
    expect(str).not.toContain('secretresettoken');
    expect(str).not.toContain('resetToken');
    expect(str).not.toContain('password');
  });

  it('provides safe defaults for optional fields', async () => {
    mockFindOne.mockResolvedValue({
      _id: new ObjectId(TEST_USER_ID),
      email: 'minimal@example.com',
    });
    const token = await signAuthToken({ userId: TEST_USER_ID, email: 'minimal@example.com', fullName: '' });
    const req = await makeAuthRequest(token);
    const res = await GET(req);
    const body = await res.json();
    expect(body.user.points).toBe(0);
    expect(body.user.level).toBe(1);
    expect(body.user.badges).toEqual([]);
    expect(body.user.isTripPublic).toBe(false);
    expect(body.user.totalTrips).toBe(0);
  });
});
