import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextRequest } from 'next/server';

export async function POST(request: Request) {
  try {
    const userId = request.headers.get('user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { destination, startDate, endDate, places } = await request.json();

    // Validate required fields
    if (!destination || !startDate || !endDate || !places || places.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Calculate total points from places
    const totalPoints = places.reduce((sum: number, place: any) => sum + place.points, 0);

    // Create the trip
    const result = await db.collection('trips').insertOne({
      userId: new ObjectId(userId),
      destination,
      startDate,
      endDate,
      totalPoints,
      createdAt: new Date().toISOString(),
      places,
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

    return NextResponse.json({
      message: 'Trip created successfully',
      tripId: result.insertedId
    });
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');
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

    // Log only when there are changes or on initial load
    const requestId = request.headers.get('x-request-id') || 'initial';
    console.log(`[${new Date().toISOString()}] Fetching trips (${requestId}):`, {
      userId,
      currentTrip: currentTrip ? {
        id: currentTrip._id.toString(),
        destination: currentTrip.destination,
        status: currentTrip.status
      } : null,
      pastTripsCount: pastTrips.length
    });

    return NextResponse.json({
      currentTrip,
      pastTrips
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}