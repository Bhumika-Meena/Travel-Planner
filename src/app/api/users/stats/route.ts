import { getAuthSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { apiSuccess, apiError } from '@/lib/api-response';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const userId = session?.userId;
    if (!userId || !ObjectId.isValid(userId)) {
      return apiError('User not authenticated', 'UNAUTHORIZED', 401);
    }

    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return apiError('User not found', 'NOT_FOUND', 404);
    }

    const userRank = await db.collection('users').countDocuments({ points: { $gt: user.points || 0 } }) + 1;

    const stats = {
      totalPoints: user.points || 0,
      totalTrips: Array.isArray(user.trips) ? user.trips.length : (user.totalTrips || 0),
      rank: userRank,
    };

    return apiSuccess({ stats });
  } catch (error: any) {
    logger.error({ err: error }, 'User stats error');
    return apiError('Error fetching user stats', 'INTERNAL_SERVER_ERROR', 500);
  }
}