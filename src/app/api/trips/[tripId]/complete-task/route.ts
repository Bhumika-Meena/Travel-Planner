import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { updateUserProgress } from '@/utils/userProgress';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    console.log('Received request to complete task for trip:', params.tripId);
    
    const userId = request.headers.get('user-id');
    if (!userId) {
      console.error('No user-id header found');
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { placeIndex } = body;
    
    console.log('Request body:', { placeIndex, userId });

    if (typeof placeIndex !== 'number') {
      console.error('Invalid placeIndex:', placeIndex);
      return NextResponse.json({ error: 'Invalid place index' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    console.log('Connected to database');

    // Validate ObjectId
    if (!ObjectId.isValid(params.tripId) || !ObjectId.isValid(userId)) {
      console.error('Invalid ObjectId:', { tripId: params.tripId, userId });
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const tripObjectId = new ObjectId(params.tripId);
    const userObjectId = new ObjectId(userId);

    // Find the trip
    const trip = await db.collection('trips').findOne({
      _id: tripObjectId,
      userId: userObjectId
    });

    if (!trip) {
      console.error('Trip not found:', { tripId: params.tripId, userId });
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    console.log('Found trip:', trip._id);

    // Check if the place exists and is not already completed
    if (!trip.places || !Array.isArray(trip.places) || !trip.places[placeIndex]) {
      console.error('Invalid place index:', placeIndex);
      return NextResponse.json({ error: 'Invalid place index' }, { status: 400 });
    }

    if (!trip.places[placeIndex].isSelected) {
      console.error('Place already completed:', placeIndex);
      return NextResponse.json({ error: 'Place already completed' }, { status: 400 });
    }

    const pointsToAdd = trip.places[placeIndex].points || 0;

    // Get current user data for proper points calculation
    const user = await db.collection('users').findOne({ _id: userObjectId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentPoints = user.points || 0;

    // Update the place status
    const updatedPlaces = [...trip.places];
    updatedPlaces[placeIndex] = {
      ...updatedPlaces[placeIndex],
      isSelected: false
    };

    // Update trip
    const result = await db.collection('trips').updateOne(
      { 
        _id: tripObjectId,
        userId: userObjectId
      },
      {
        $set: { places: updatedPlaces },
        $inc: { totalPoints: pointsToAdd }
      }
    );

    if (result.modifiedCount === 0) {
      console.error('Failed to update trip:', { tripId: params.tripId, userId });
      return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 });
    }

    // Update user's total points
    const userUpdateResult = await db.collection('users').updateOne(
      { _id: userObjectId },
      { $inc: { points: pointsToAdd } }
    );

    if (userUpdateResult.modifiedCount === 0) {
      console.error('Failed to update user points:', { userId });
      return NextResponse.json({ error: 'Failed to update user points' }, { status: 500 });
    }

    // Check and update level/badges with the correct total points
    const progressUpdate = await updateUserProgress(userId, currentPoints + pointsToAdd);

    console.log('Successfully completed task');
    return NextResponse.json({
      success: true,
      points: currentPoints + pointsToAdd,
      progressUpdate
    }, { status: 200 });
  } catch (error) {
    console.error('Error completing task:', error);
    return NextResponse.json(
      { error: 'Failed to complete task' },
      { status: 500 }
    );
  }
} 