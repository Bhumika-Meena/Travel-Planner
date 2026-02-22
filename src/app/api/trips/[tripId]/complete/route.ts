import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const userId = request.headers.get('user-id');
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

    // Update trip status to past
    const result = await db.collection('trips').updateOne(
      { _id: new ObjectId(params.tripId) },
      { $set: { status: 'past' } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to update trip status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing trip:', error);
    return NextResponse.json(
      { error: 'Failed to complete trip' },
      { status: 500 }
    );
  }
} 