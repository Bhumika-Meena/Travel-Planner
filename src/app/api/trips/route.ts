import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextRequest } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { calculateTaskReward } from '@/lib/gamification';
import { TripCreateSchema, validationError } from '@/lib/schemas';
import logger from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    const userId = session?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const body = await request.json();

    // Zod validation: structure, required fields, and date ordering
    const parsed = TripCreateSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const { destination, startDate, endDate, places } = parsed.data;

    if (places.length > 50) {
      return NextResponse.json(
        { error: 'A trip can have at most 50 places' },
        { status: 400 }
      );
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

    return NextResponse.json({
      message: 'Trip created successfully',
      tripId: result.insertedId
    });
  } catch (error) {
    logger.error({ err: error }, 'Error creating trip');
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    const userId = session?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    // Validate ObjectId
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }
    
    // Get current trip
    const currentTrip = await db.collection('trips').findOne({
      userId: new ObjectId(userId),
      status: 'current'
    });

    // Get past trips
    const pastTrips = await db.collection('trips')
      .find({
        userId: new ObjectId(userId),
        status: 'past'
      })
      .sort({ createdAt: -1 })
      .toArray();

    const requestId = request.headers.get('x-request-id') || 'initial';
    logger.debug({ userId, requestId, hasCurrent: !!currentTrip, pastTripsCount: pastTrips.length }, 'Fetching trips');

    return NextResponse.json({
      currentTrip,
      pastTrips
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching trips');
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}