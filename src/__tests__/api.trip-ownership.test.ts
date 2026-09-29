/**
 * Integration tests for trip ownership and detail endpoints:
 * - GET /api/trips/[tripId]
 * - DELETE /api/trips/[tripId]
 * - POST /api/trips/[tripId]/complete
 */

import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { ObjectId } from 'mongodb';

const mockTripFindOne = jest.fn();
const mockTripDeleteOne = jest.fn();
const mockTripUpdateOne = jest.fn();
const mockUserFindOne = jest.fn();
const mockUserUpdateOne = jest.fn();

jest.unstable_mockModule('@/lib/mongodb', () => ({
  connectToDatabase: jest.fn(() =>
    Promise.resolve({
      db: {
        collection: jest.fn((name: string) => {
          if (name === 'trips') {
            return {
              findOne: mockTripFindOne,
              deleteOne: mockTripDeleteOne,
              updateOne: mockTripUpdateOne,
            };
          }
          if (name === 'users') {
            return {
              findOne: mockUserFindOne,
              updateOne: mockUserUpdateOne,
            };
          }
          return {};
        }),
      },
      client: {},
    })
  ),
}));

jest.unstable_mockModule('@/utils/userProgress', () => ({
  updateUserProgress: jest.fn().mockResolvedValue({ level: 1, newBadges: [] }),
}));

jest.unstable_mockModule('@/lib/env', () => ({
  validateEnvironment: jest.fn(() => ({ valid: true, errors: [], warnings: [] })),
}));

const { signAuthToken } = await import('@/lib/auth');
const { GET: getTrip, DELETE: deleteTrip } = await import('@/app/api/trips/[tripId]/route');
const { POST: completeTrip } = await import('@/app/api/trips/[tripId]/complete/route');

const OWNER_ID = new ObjectId().toString();
const ATTACKER_ID = new ObjectId().toString();
const TRIP_ID = new ObjectId().toString();

const SAMPLE_TRIP = {
  _id: new ObjectId(TRIP_ID),
  userId: new ObjectId(OWNER_ID),
  destination: 'Kyoto, Japan',
  status: 'planned',
  places: [{ name: 'Fushimi Inari', isSelected: true }],
};

async function createRequest(
  method: string,
  userId?: string,
  body?: Record<string, unknown>
): Promise<any> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (userId) {
    const token = await signAuthToken({ userId, email: 'test@example.com', fullName: 'Tester' });
    headers['cookie'] = `auth_token=${token}`;
  }
  return new Request(`http://localhost/api/trips/${TRIP_ID}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('Trip Ownership & Lifecycle API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/trips/[tripId]', () => {
    it('returns 401 when request is unauthenticated', async () => {
      const req = await createRequest('GET');
      const res = await getTrip(req, { params: { tripId: TRIP_ID } });
      expect(res.status).toBe(401);
    });

    it('returns 400 for invalid tripId format', async () => {
      const req = await createRequest('GET', OWNER_ID);
      const res = await getTrip(req, { params: { tripId: 'not-an-objectid' } });
      expect(res.status).toBe(400);
    });

    it('returns 404 if trip does not belong to authenticated user (ownership check)', async () => {
      mockTripFindOne.mockResolvedValue(null); // query includes { _id: tripId, userId: attackerId }
      const req = await createRequest('GET', ATTACKER_ID);
      const res = await getTrip(req, { params: { tripId: TRIP_ID } });
      expect(res.status).toBe(404);
    });

    it('returns trip successfully when user is the owner', async () => {
      mockTripFindOne.mockResolvedValue(SAMPLE_TRIP);
      const req = await createRequest('GET', OWNER_ID);
      const res = await getTrip(req, { params: { tripId: TRIP_ID } });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.destination).toBe('Kyoto, Japan');
    });
  });

  describe('DELETE /api/trips/[tripId]', () => {
    it('returns 401 when unauthenticated', async () => {
      const req = await createRequest('DELETE');
      const res = await deleteTrip(req, { params: { tripId: TRIP_ID } });
      expect(res.status).toBe(401);
    });

    it('returns 404 when non-owner attempts to delete the trip', async () => {
      mockTripFindOne.mockResolvedValue(null);
      const req = await createRequest('DELETE', ATTACKER_ID);
      const res = await deleteTrip(req, { params: { tripId: TRIP_ID } });
      expect(res.status).toBe(404);
    });

    it('deletes trip and updates user trip counter when owner requests', async () => {
      mockTripFindOne.mockResolvedValue(SAMPLE_TRIP);
      mockTripDeleteOne.mockResolvedValue({ deletedCount: 1 });
      mockUserUpdateOne.mockResolvedValue({ modifiedCount: 1 });

      const req = await createRequest('DELETE', OWNER_ID);
      const res = await deleteTrip(req, { params: { tripId: TRIP_ID } });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(mockTripDeleteOne).toHaveBeenCalledWith({
        _id: new ObjectId(TRIP_ID),
        userId: new ObjectId(OWNER_ID),
      });
      expect(mockUserUpdateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(OWNER_ID) },
        expect.objectContaining({ $inc: { totalTrips: -1 } })
      );
    });
  });

  describe('POST /api/trips/[tripId]/complete', () => {
    it('returns 401 when unauthenticated', async () => {
      const req = await createRequest('POST');
      const res = await completeTrip(req, { params: { tripId: TRIP_ID } });
      expect(res.status).toBe(401);
    });

    it('returns 404 if trip does not belong to user', async () => {
      mockTripFindOne.mockResolvedValue(null);
      const req = await createRequest('POST', ATTACKER_ID);
      const res = await completeTrip(req, { params: { tripId: TRIP_ID } });
      expect(res.status).toBe(404);
    });

    it('marks trip as past and calculates badge progress', async () => {
      mockTripFindOne.mockResolvedValue(SAMPLE_TRIP);
      mockTripUpdateOne.mockResolvedValue({ modifiedCount: 1 });
      mockUserFindOne.mockResolvedValue({ _id: new ObjectId(OWNER_ID), points: 100 });

      const req = await createRequest('POST', OWNER_ID);
      const res = await completeTrip(req, { params: { tripId: TRIP_ID } });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(mockTripUpdateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(TRIP_ID), userId: new ObjectId(OWNER_ID) },
        { $set: { status: 'past' } }
      );
    });

    it('handles idempotent completion when trip is already past', async () => {
      mockTripFindOne.mockResolvedValue({ ...SAMPLE_TRIP, status: 'past' });
      mockUserFindOne.mockResolvedValue({ _id: new ObjectId(OWNER_ID), points: 100 });

      const req = await createRequest('POST', OWNER_ID);
      const res = await completeTrip(req, { params: { tripId: TRIP_ID } });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toMatch(/already completed/i);
      expect(mockTripUpdateOne).not.toHaveBeenCalled();
    });
  });
});
