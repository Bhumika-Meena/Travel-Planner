import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
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

    return NextResponse.json(trip);
  } catch (error) {
    console.error('Error fetching trip:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trip' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    console.log('Attempting to delete trip:', params.tripId);
    
    const userId = request.headers.get('user-id');
    if (!userId) {
      console.error('No user-id header found');
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    console.log('Connected to database');

    // Validate ObjectId
    if (!ObjectId.isValid(params.tripId) || !ObjectId.isValid(userId)) {
      console.error('Invalid ObjectId:', { tripId: params.tripId, userId });
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // First check if the trip exists
    const trip = await db.collection('trips').findOne({
      _id: new ObjectId(params.tripId),
      userId: new ObjectId(userId)
    });

    if (!trip) {
      console.error('Trip not found:', { tripId: params.tripId, userId });
      return NextResponse.json({ 
        error: 'Trip not found',
        details: 'The trip you are trying to delete does not exist or you do not have permission to delete it'
      }, { status: 404 });
    }

    console.log('Found trip to delete:', trip._id);

    // Delete the trip
    const result = await db.collection('trips').deleteOne({
      _id: new ObjectId(params.tripId),
      userId: new ObjectId(userId)
    });

    if (result.deletedCount === 0) {
      console.error('Failed to delete trip:', { tripId: params.tripId, userId });
      return NextResponse.json({ 
        error: 'Failed to delete trip',
        details: 'The trip could not be deleted. Please try again.'
      }, { status: 500 });
    }

    console.log('Successfully deleted trip:', params.tripId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting trip:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete trip',
        details: 'An unexpected error occurred while deleting the trip'
      },
      { status: 500 }
    );
  }
} 