/**
 * Integration tests for POST /api/trips/[tripId]/complete-task.
 */

import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { ObjectId } from 'mongodb';

// ── Module mocks ─────────────────────────────────────────────────────────────

const mockTripFindOne = jest.fn();
const mockTripUpdateOne = jest.fn();
const mockUserFindOneAndUpdate = jest.fn();

const mockWithTransaction = jest.fn(async (fn: Function) => { await fn(); });
const mockEndSession = jest.fn();
const mockStartSession = jest.fn(() => ({
  withTransaction: mockWithTransaction,
  endSession: mockEndSession,
}));

jest.unstable_mockModule('@/lib/mongodb', () => ({
  connectToDatabase: jest.fn(() =>
    Promise.resolve({
      db: {
        collection: jest.fn((name: string) => {
          if (name === 'trips') return { findOne: mockTripFindOne, updateOne: mockTripUpdateOne };
          if (name === 'users') return { findOneAndUpdate: mockUserFindOneAndUpdate };
          return {};
        }),
      },
      client: { startSession: mockStartSession },
    })
  ),
}));

jest.unstable_mockModule('@/utils/userProgress', () => ({
  updateUserProgress: jest.fn().mockResolvedValue(null),
}));

jest.unstable_mockModule('@/lib/env', () => ({
  validateEnvironment: jest.fn(() => ({ valid: true, errors: [], warnings: [] })),
}));

// ── Dynamic imports after mocking ────────────────────────────────────────────

const { signAuthToken } = await import('@/lib/auth');
const { POST } = await import('@/app/api/trips/[tripId]/complete-task/route');

// ── Helpers ──────────────────────────────────────────────────────────────────

const TRIP_ID = new ObjectId().toString();
const USER_ID = '507f1f77bcf86cd799439011';

async function makeRequest(body: Record<string, unknown>): Promise<Request> {
  const token = await signAuthToken({ userId: USER_ID, email: 't@t.com', fullName: 'Tester' });
  return new Request(`http://localhost/api/trips/${TRIP_ID}/complete-task`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: `auth_token=${token}`,
    },
    body: JSON.stringify(body),
  });
}

const SAMPLE_TRIP = {
  _id: new ObjectId(TRIP_ID),
  userId: new ObjectId(USER_ID),
  places: [
    { name: 'Eiffel Tower', description: 'A'.repeat(100), isSelected: true },
    { name: 'Louvre', description: 'Short', isSelected: false },
  ],
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/trips/[tripId]/complete-task', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTripFindOne.mockResolvedValue(SAMPLE_TRIP);
    mockTripUpdateOne.mockResolvedValue({ modifiedCount: 1 });
    mockUserFindOneAndUpdate.mockResolvedValue({ points: 25 });
    mockWithTransaction.mockImplementation(async (fn: Function) => { await fn(); });
  });

  it('returns 401 for unauthenticated request', async () => {
    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/complete-task`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ placeIndex: 0 }),
    });
    const res = await POST(req as any, { params: { tripId: TRIP_ID } });
    expect(res.status).toBe(401);
  });

  it('returns 400 for a non-integer placeIndex', async () => {
    const res = await POST(await makeRequest({ placeIndex: 'abc' }) as any, { params: { tripId: TRIP_ID } });
    expect(res.status).toBe(400);
  });

  it('returns 400 for a negative placeIndex', async () => {
    const res = await POST(await makeRequest({ placeIndex: -1 }) as any, { params: { tripId: TRIP_ID } });
    expect(res.status).toBe(400);
  });

  it('returns 404 when trip is not found', async () => {
    mockTripFindOne.mockResolvedValue(null);
    const res = await POST(await makeRequest({ placeIndex: 0 }) as any, { params: { tripId: TRIP_ID } });
    expect(res.status).toBe(404);
  });

  it('returns 400 when place is already completed (isSelected: false)', async () => {
    const res = await POST(await makeRequest({ placeIndex: 1 }) as any, { params: { tripId: TRIP_ID } });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/already completed/i);
  });

  it('uses server-authoritative points (15 for long description)', async () => {
    await POST(await makeRequest({ placeIndex: 0 }) as any, { params: { tripId: TRIP_ID } });
    const updateCall = mockUserFindOneAndUpdate.mock.calls[0] as any[];
    expect(updateCall[1].$inc.points).toBe(15);
  });

  it('returns success with points on valid completion', async () => {
    const res = await POST(await makeRequest({ placeIndex: 0 }) as any, { params: { tripId: TRIP_ID } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(typeof body.points).toBe('number');
  });

  it('returns 400 for invalid ObjectId tripId', async () => {
    const res = await POST(await makeRequest({ placeIndex: 0 }) as any, { params: { tripId: 'not-an-objectid' } });
    expect(res.status).toBe(400);
  });
});
