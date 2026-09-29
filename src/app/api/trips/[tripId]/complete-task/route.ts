import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { updateUserProgress } from '@/utils/userProgress';
import { getAuthSession } from '@/lib/auth';
import { calculateTaskReward } from '@/lib/gamification';
import { CompleteTaskSchema, validationError } from '@/lib/schemas';
import logger from '@/lib/logger';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

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

    const body = await request.json();
    const parsedBody = CompleteTaskSchema.safeParse(body);
    if (!parsedBody.success) return validationError(parsedBody.error);

    const { placeIndex } = parsedBody.data;

    // Validate ObjectId format
    if (!ObjectId.isValid(params.tripId) || !ObjectId.isValid(userId)) {
      return apiError('Invalid ID format', 'INVALID_ID', 400);
    }

    const tripObjectId = new ObjectId(params.tripId);
    const userObjectId = new ObjectId(userId);

    const { db, client } = await connectToDatabase();

    // Find the trip
    const trip = await db.collection('trips').findOne({
      _id: tripObjectId,
      userId: userObjectId
    });

    if (!trip) {
      return apiError('Trip not found', 'NOT_FOUND', 404);
    }

    // Check if the place exists and is not already completed
    if (!trip.places || !Array.isArray(trip.places) || !trip.places[placeIndex]) {
      return apiError('Invalid place index', 'INVALID_PLACE_INDEX', 400);
    }

    if (!trip.places[placeIndex].isSelected) {
      return apiError('Place already completed', 'ALREADY_COMPLETED', 400);
    }

    // Authoritative Server-Side Reward Calculation:
    // Client-provided points are NEVER trusted. Points are strictly determined by server rules.
    const pointsToAdd = calculateTaskReward(trip.places[placeIndex]);

    let newPoints = 0;
    let transactionCompleted = false;

    // 1. Attempt replica-set transaction for strict ACID atomicity across trips & users collections
    try {
      const mongoSession = client.startSession();
      try {
        await mongoSession.withTransaction(async () => {
          // Atomically mark place as completed ONLY if currently isSelected: true
          const tripRes = await db.collection('trips').updateOne(
            { 
              _id: tripObjectId,
              userId: userObjectId,
              [`places.${placeIndex}.isSelected`]: true
            },
            {
              $set: {
                [`places.${placeIndex}.isSelected`]: false,
                [`places.${placeIndex}.completedAt`]: new Date()
              }
            },
            { session: mongoSession }
          );

          if (tripRes.modifiedCount === 0) {
            throw new Error('ALREADY_COMPLETED');
          }

          // Atomically increment user points within the same transaction
          const userRes = await db.collection('users').findOneAndUpdate(
            { _id: userObjectId },
            { $inc: { points: pointsToAdd } },
            { returnDocument: 'after', session: mongoSession }
          );

          newPoints = (userRes as any)?.points ?? ((userRes as any)?.value?.points ?? pointsToAdd);
        });
        transactionCompleted = true;
      } finally {
        await mongoSession.endSession();
      }
    } catch (txErr: any) {
      if (txErr.message === 'ALREADY_COMPLETED') {
        return apiError('Place already completed', 'ALREADY_COMPLETED', 400);
      }
      // If transactions are not supported on this MongoDB instance (e.g. standalone Mongo), fall back to compensated atomic execution
    }

    // 2. Compensated atomic execution fallback if transactions are unavailable
    if (!transactionCompleted) {
      // Step A: Atomically mark place as completed
      const tripRes = await db.collection('trips').updateOne(
        { 
          _id: tripObjectId,
          userId: userObjectId,
          [`places.${placeIndex}.isSelected`]: true
        },
        {
          $set: {
            [`places.${placeIndex}.isSelected`]: false,
            [`places.${placeIndex}.completedAt`]: new Date()
          }
        }
      );

      if (tripRes.modifiedCount === 0) {
        return apiError('Place already completed', 'ALREADY_COMPLETED', 400);
      }

      // Step B: Atomically increment user points with rollback compensation
      try {
        const userUpdateResult = await db.collection('users').findOneAndUpdate(
          { _id: userObjectId },
          { $inc: { points: pointsToAdd } },
          { returnDocument: 'after' }
        );
        newPoints = (userUpdateResult as any)?.points ?? ((userUpdateResult as any)?.value?.points ?? pointsToAdd);
      } catch (userErr) {
        // Rollback place completion so user does not lose points if database operation fails
        logger.error({ err: userErr, userId, tripId: params.tripId, placeIndex }, 'Failed to increment points, rolling back place status');
        await db.collection('trips').updateOne(
          {
            _id: tripObjectId,
            userId: userObjectId,
            [`places.${placeIndex}.isSelected`]: false
          },
          {
            $set: { [`places.${placeIndex}.isSelected`]: true },
            $unset: { [`places.${placeIndex}.completedAt`]: "" }
          }
        );
        throw new Error('Database operation failed while awarding points. Place completion was rolled back safely.');
      }
    }

    // Check and update level/badges with the new authoritative total points
    const progressUpdate = await updateUserProgress(userId, newPoints);

    return apiSuccess({
      points: newPoints,
      progressUpdate
    }, 200);
  } catch (error: any) {
    logger.error({ err: error }, 'Error completing task');
    return apiError(
      error?.message || 'Failed to complete task',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
} 