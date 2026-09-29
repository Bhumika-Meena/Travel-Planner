import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getAuthSession } from '@/lib/auth';
import { updateUserProgress } from '@/utils/userProgress';
import { apiSuccess, apiError } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function POST(
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

    // If trip is already completed, return idempotent success
    if (trip.status === 'past') {
      const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
      const progressUpdate = user ? await updateUserProgress(userId, user.points || 0) : null;
      return apiSuccess({ message: 'Trip already completed', progressUpdate }, 200);
    }

    // Update trip status to past
    await db.collection('trips').updateOne(
      { _id: new ObjectId(params.tripId), userId: new ObjectId(userId) },
      { $set: { status: 'past' } }
    );

    // Check and trigger trip completion badges (e.g. Bon Voyage, Frequent Flyer)
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    const progressUpdate = user ? await updateUserProgress(userId, user.points || 0) : null;

    return apiSuccess({ progressUpdate, completed: true });
  } catch (error) {
    logger.error({ err: error, tripId: params.tripId }, 'Error completing trip');
    return apiError('Failed to complete trip', 'INTERNAL_SERVER_ERROR', 500);
  }
}