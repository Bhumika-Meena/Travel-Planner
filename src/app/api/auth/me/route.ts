import { getAuthSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import logger from '@/lib/logger';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (!session || !ObjectId.isValid(session.userId)) {
      return apiSuccess({ user: null }, 200);
    }

    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(session.userId) },
      {
        projection: {
          password: 0,
          resetToken: 0,
          resetTokenExpiry: 0,
        },
      }
    );

    if (!user) {
      return apiSuccess({ user: null }, 200);
    }

    return apiSuccess({
      user: {
        _id: user._id.toString(),
        fullName: user.fullName || user.name || '',
        email: user.email,
        points: user.points || 0,
        level: user.level || 1,
        badges: user.badges || [],
        profilePicture: user.profilePicture || null,
        bio: user.bio || '',
        totalTrips: user.totalTrips || 0,
        isVerified: user.isVerified || false,
        isTripPublic: user.isTripPublic ?? false,
      },
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Error in /api/auth/me');
    return apiError('Internal server error', 'INTERNAL_SERVER_ERROR', 500);
  }
}
