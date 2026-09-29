import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextRequest } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { calculateTaskReward } from '@/lib/gamification';
import { TripCreateSchema, validationError } from '@/lib/schemas';
import logger from '@/lib/logger';

import { apiSuccess, apiError } from '@/lib/api-response';

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    const userId = session?.userId;
    if (!userId) {
      return apiError('User not authenticated', 'UNAUTHORIZED', 401);
    }

    const body = await request.json();

    // Zod validation: structure, required fields, and date ordering
    const parsed = TripCreateSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const { destination, startDate, endDate, places } = parsed.data;

    if (places.length > 50) {
      return apiError('A trip can have at most 50 places', 'LIMIT_EXCEEDED', 400);
    }

    // Sanitize places and assign server-authoritative points (never trust client points)
    const sanitizedPlaces = places.map((place: any, index: number) => {
      const name = typeof place.name === 'string' ? place.name.trim().slice(0, 150) : `Place ${index + 1}`;
      const description = typeof place.description === 'string' ? place.description.trim().slice(0, 500) : '';
      const points = calculateTaskReward(place);
      return {
        ...place,
        name: name || `Place ${index + 1}`,
        description,
        points,
        isSelected: place.isSelected !== undefined ? Boolean(place.isSelected) : true
      };
    });

    const { db } = await connectToDatabase();

    // Calculate total points from sanitized places
    const totalPoints = sanitizedPlaces.reduce((sum: number, place: any) => sum + place.points, 0);

    // Create the trip
    const result = await db.collection('trips').insertOne({
      userId: new ObjectId(userId),
      destination: destination.trim(),
      startDate,
      endDate,
      totalPoints,
      createdAt: new Date().toISOString(),
      places: sanitizedPlaces,
      status: 'current' // Set initial status as current
    });

    // Update any existing current trip to past
    await db.collection('trips').updateOne(
      {
        userId: new ObjectId(userId),
        status: 'current',
        _id: { $ne: result.insertedId }
      },
      { $set: { status: 'past' } }
    );

    // Update user's trips array and totalTrips count
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $push: { trips: result.insertedId } as any,
        $inc: { totalTrips: 1 }
      }
    );

    return apiSuccess({
      message: 'Trip created successfully',
      tripId: result.insertedId.toString()
    }, 200);
  } catch (error) {
    logger.error({ err: error }, 'Error creating trip');
    return apiError('Failed to create trip', 'INTERNAL_SERVER_ERROR', 500);
  }
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    const userId = session?.userId;
    if (!userId) {
      return apiError('User not authenticated', 'UNAUTHORIZED', 401);
    }

    const { db } = await connectToDatabase();

    // Validate ObjectId
    if (!ObjectId.isValid(userId)) {
      return apiError('Invalid user ID format', 'INVALID_ID', 400);
    }

    // Pagination query parameters
    let page = 1;
    let limit = 20;
    try {
      const url = new URL(request.url);
      page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
      limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20));
    } catch {
      // In test or non-URL environments
    }
    const skip = (page - 1) * limit;
    
    // Get current trip
    const currentTrip = await db.collection('trips').findOne({
      userId: new ObjectId(userId),
      status: 'current'
    });

    // Get past trips with cursor pagination support
    let pastTripsQuery = db.collection('trips')
      .find({
        userId: new ObjectId(userId),
        status: 'past'
      })
      .sort({ createdAt: -1 });

    if (typeof pastTripsQuery.skip === 'function') {
      pastTripsQuery = pastTripsQuery.skip(skip);
    }
    if (typeof pastTripsQuery.limit === 'function') {
      pastTripsQuery = pastTripsQuery.limit(limit);
    }

    const pastTrips = await pastTripsQuery.toArray();

    const totalPastTrips = typeof db.collection('trips').countDocuments === 'function'
      ? await db.collection('trips').countDocuments({ userId: new ObjectId(userId), status: 'past' })
      : pastTrips.length;

    const totalPages = Math.ceil(totalPastTrips / limit) || 1;

    const requestId = request.headers.get('x-request-id') || 'initial';
    logger.debug({ userId, requestId, hasCurrent: !!currentTrip, pastTripsCount: pastTrips.length }, 'Fetching trips');

    return apiSuccess({
      currentTrip,
      pastTrips,
      pagination: {
        page,
        limit,
        total: totalPastTrips,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching trips');
    return apiError('Failed to fetch trips', 'INTERNAL_SERVER_ERROR', 500);
  }
}