import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getAuthSession } from '@/lib/auth';
import { ProfileUpdateSchema, validationError } from '@/lib/schemas';
import { apiSuccess, apiError } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    // Validate user ID format
    if (!ObjectId.isValid(userId)) {
      return apiError('Invalid user ID format', 'INVALID_ID', 400);
    }

    const session = await getAuthSession(request);
    const isOwner = session?.userId === userId;

    const projection: Record<string, number> = {
      _id: 1,
      fullName: 1,
      profilePicture: 1,
      points: 1,
      level: 1,
      badges: 1,
      totalTrips: 1,
      bio: 1,
      isTripPublic: 1
    };

    if (isOwner) {
      projection.email = 1;
    }

    const { db } = await connectToDatabase();
    
    // Find the user
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection }
    );

    if (!user) {
      return apiError('User not found', 'NOT_FOUND', 404);
    }

    // Profile Privacy: trips are private by default. Only expose current trip destination/dates
    // if requester is the profile owner OR user has explicitly opted-in with isTripPublic: true.
    const isTripPublic = user.isTripPublic === true;
    let currentTrip = null;

    if (isOwner || isTripPublic) {
      currentTrip = await db.collection('trips').findOne(
        { userId: new ObjectId(userId), status: 'current' },
        {
          projection: {
            _id: 1,
            destination: 1,
            startDate: 1,
            endDate: 1
          }
        }
      );
    }

    const profileData = {
      ...user,
      isTripPublic,
      currentTrip: currentTrip || null
    };

    return apiSuccess(profileData);
  } catch (error) {
    logger.error({ err: error, userId: params.userId }, 'Error fetching user profile');
    return apiError('Internal server error', 'INTERNAL_SERVER_ERROR', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getAuthSession(request);
    const userId = session?.userId;
    if (!userId) {
      return apiError('User not authenticated', 'UNAUTHORIZED', 401);
    }

    // Verify that the requested userId matches the authenticated user
    if (userId !== params.userId) {
      return apiError('Unauthorized: You can only edit your own profile', 'FORBIDDEN', 403);
    }

    const { db } = await connectToDatabase();

    // Validate ObjectId
    if (!ObjectId.isValid(userId)) {
      return apiError('Invalid user ID format', 'INVALID_ID', 400);
    }

    // Get request body
    const body = await request.json();
    const parsed = ProfileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { fullName, email, bio, isTripPublic } = parsed.data;
    const updateFields: Record<string, any> = { fullName, email, bio };
    if (typeof isTripPublic === 'boolean') {
      updateFields.isTripPublic = isTripPublic;
    }

    // Update user data
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return apiError('User not found', 'NOT_FOUND', 404);
    }

    // Get updated user data
    const updatedUser = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          password: 0,
          resetToken: 0,
          resetTokenExpiry: 0
        }
      }
    );

    if (!updatedUser) {
      return apiError('User not found', 'NOT_FOUND', 404);
    }

    // Get user's current trip
    const currentTrip = await db.collection('trips').findOne({
      userId: new ObjectId(userId),
      status: 'current'
    });

    // Get total trips count
    const totalTrips = await db.collection('trips').countDocuments({
      userId: new ObjectId(userId)
    });

    const userData = {
      _id: updatedUser._id.toString(),
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      points: updatedUser.points || 0,
      profilePicture: updatedUser.profilePicture || null,
      level: updatedUser.level || 1,
      badges: updatedUser.badges || [],
      bio: updatedUser.bio || '',
      isTripPublic: updatedUser.isTripPublic === true,
      totalTrips,
      currentTrip: currentTrip || null
    };

    return apiSuccess(userData);
  } catch (error) {
    logger.error({ err: error, userId: params.userId }, 'Error updating user data');
    return apiError('Failed to update user data', 'INTERNAL_SERVER_ERROR', 500);
  }
}