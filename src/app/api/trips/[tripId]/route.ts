import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getAuthSession } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getAuthSession(request);
    const userId = session?.userId;
    if (!userId) {
      return apiError('User not authenticated', 'UNAUTHORIZED', 401);
    }

    const { db } = await connectToDatabase();

    // Validate ObjectId
    if (!ObjectId.isValid(params.tripId) || !ObjectId.isValid(userId)) {
      return apiError('Invalid ID format', 'INVALID_ID', 400);
    }

    // Find the trip
    const trip = await db.collection('trips').findOne({
      _id: new ObjectId(params.tripId),
      userId: new ObjectId(userId),
    });

    if (!trip) {
      return apiError('Trip not found', 'NOT_FOUND', 404);
    }

    return apiSuccess(trip);
  } catch (error) {
    logger.error({ err: error, tripId: params.tripId }, 'Error fetching trip');
    return apiError('Failed to fetch trip', 'INTERNAL_SERVER_ERROR', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getAuthSession(request);
    const userId = session?.userId;
    if (!userId) {
      return apiError('User not authenticated', 'UNAUTHORIZED', 401);
    }

    const { db } = await connectToDatabase();

    // Validate ObjectId
    if (!ObjectId.isValid(params.tripId) || !ObjectId.isValid(userId)) {
      return apiError('Invalid ID format', 'INVALID_ID', 400);
    }

    // First check if the trip exists and belongs to the user
    const trip = await db.collection('trips').findOne({
      _id: new ObjectId(params.tripId),
      userId: new ObjectId(userId),
    });

    if (!trip) {
      return apiError(
        'Trip not found',
        'NOT_FOUND',
        404,
        [{ message: 'The trip you are trying to delete does not exist or you do not have permission to delete it' }]
      );
    }

    // Delete the trip
    const result = await db.collection('trips').deleteOne({
      _id: new ObjectId(params.tripId),
      userId: new ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      return apiError('Failed to delete trip', 'DATABASE_ERROR', 500);
    }

    // Pull from user's trips array and decrement totalTrips
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $pull: { trips: new ObjectId(params.tripId) } as any,
        $inc: { totalTrips: -1 },
      }
    );

    return apiSuccess({ deleted: true, tripId: params.tripId });
  } catch (error) {
    logger.error({ err: error, tripId: params.tripId }, 'Error deleting trip');
    return apiError('Failed to delete trip', 'INTERNAL_SERVER_ERROR', 500);
  }
}