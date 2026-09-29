/**
 * Integration tests for POST /api/trips (create trip) and GET /api/trips (list trips).
 */

import { jest, describe, beforeEach, it, expect } from '@jest/globals';

// ── Module mocks ─────────────────────────────────────────────────────────────

const mockFindOne = jest.fn();
const mockInsertOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockFind = jest.fn();

const mockCollection = jest.fn((name: string) => {
  if (name === 'trips') {
    return { findOne: mockFindOne, insertOne: mockInsertOne, updateOne: mockUpdateOne, find: mockFind };
  }
  return { findOne: mockFindOne, updateOne: mockUpdateOne };
});

jest.unstable_mockModule('@/lib/mongodb', () => ({
  connectToDatabase: jest.fn(() =>
    Promise.resolve({ db: { collection: mockCollection }, client: {} })
  ),
}));

jest.unstable_mockModule('@/lib/env', () => ({
  validateEnvironment: jest.fn(() => ({ valid: true, errors: [], warnings: [] })),
}));

// ── Dynamic imports after mocking ────────────────────────────────────────────

const { signAuthToken } = await import('@/lib/auth');
const { POST, GET } = await import('@/app/api/trips/route');

// ── Helpers ──────────────────────────────────────────────────────────────────

async function makeAuthRequest(method: 'GET' | 'POST', body?: Record<string, unknown>): Promise<Request> {
  const token = await signAuthToken({ userId: '507f1f77bcf86cd799439011', email: 't@t.com', fullName: 'Tester' });
  return new Request('http://localhost/api/trips', {
    method,
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
      cookie: `auth_token=${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

const VALID_TRIP = {
  destination: 'Paris',
  startDate: '2025-06-01',
  endDate: '2025-06-10',
  places: [{ name: 'Eiffel Tower', description: 'Iconic landmark', isSelected: true }],
};

// ── POST tests ───────────────────────────────────────────────────────────────

describe('POST /api/trips', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInsertOne.mockResolvedValue({ insertedId: 'trip123' });
    mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });
  });

  it('creates a trip and returns tripId for authenticated user', async () => {
    const res = await POST(await makeAuthRequest('POST', VALID_TRIP));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tripId).toBeDefined();
    expect(body.message).toMatch(/created/i);
  });

  it('returns 401 for unauthenticated request', async () => {
    const req = new Request('http://localhost/api/trips', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(VALID_TRIP),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when destination is missing', async () => {
    const res = await POST(await makeAuthRequest('POST', { ...VALID_TRIP, destination: '' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when places array is empty', async () => {
    const res = await POST(await makeAuthRequest('POST', { ...VALID_TRIP, places: [] }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when startDate >= endDate', async () => {
    const res = await POST(await makeAuthRequest('POST', {
      ...VALID_TRIP,
      startDate: '2025-06-10',
      endDate: '2025-06-01',
    }));
    expect(res.status).toBe(400);
  });

  it('ignores client-submitted points and calculates server-side', async () => {
    const tripWithFakePoints = {
      ...VALID_TRIP,
      places: [{ name: 'Eiffel Tower', description: 'Short', points: 9999, isSelected: true }],
    };
    await POST(await makeAuthRequest('POST', tripWithFakePoints));
    const insertedDoc = mockInsertOne.mock.calls[0][0] as { places: Array<{ points: number }> };
    expect(insertedDoc.places[0].points).not.toBe(9999);
    expect(insertedDoc.places[0].points).toBe(10);
  });

  it('returns 400 when destination exceeds 100 characters', async () => {
    const res = await POST(await makeAuthRequest('POST', {
      ...VALID_TRIP,
      destination: 'A'.repeat(101),
    }));
    expect(res.status).toBe(400);
  });
});

// ── GET tests ────────────────────────────────────────────────────────────────

describe('GET /api/trips', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindOne.mockResolvedValue(null);
    mockFind.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
    });
  });

  it('returns currentTrip and pastTrips for authenticated user', async () => {
    const res = await GET(await makeAuthRequest('GET') as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('currentTrip');
    expect(body).toHaveProperty('pastTrips');
  });

  it('returns pagination metadata with page, limit, total, totalPages', async () => {
    const res = await GET(await makeAuthRequest('GET') as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('pagination');
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBe(20);
    expect(typeof body.pagination.total).toBe('number');
  });

  it('returns 401 for unauthenticated request', async () => {
    const req = new Request('http://localhost/api/trips') as any;
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
