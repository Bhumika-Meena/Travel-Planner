import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getAuthSession } from '@/lib/auth';
import { updateUserProgress } from '@/utils/userProgress';

export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getAuthSession(request);
    const userId = session?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    // Validate ObjectId
    if (!ObjectId.isValid(params.tripId) || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // Find the trip
    const trip = await db.collection('trips').findOne({
      _id: new ObjectId(params.tripId),
      userId: new ObjectId(userId)
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // If trip is already completed, return idempotent success
    if (trip.status === 'past') {
      const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
      const progressUpdate = user ? await updateUserProgress(userId, user.points || 0) : null;
      return NextResponse.json({ success: true, message: 'Trip already completed', progressUpdate }, { status: 200 });
    }

    // Update trip status to past
    await db.collection('trips').updateOne(
      { _id: new ObjectId(params.tripId), userId: new ObjectId(userId) },
      { $set: { status: 'past' } }
    );

    // Check and trigger trip completion badges (e.g. Bon Voyage, Frequent Flyer)
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    const progressUpdate = user ? await updateUserProgress(userId, user.points || 0) : null;

    return NextResponse.json({ success: true, progressUpdate });
  } catch (error) {
    console.error('Error completing trip:', error);
    return NextResponse.json(
      { error: 'Failed to complete trip' },
      { status: 500 }
    );
  }
} 