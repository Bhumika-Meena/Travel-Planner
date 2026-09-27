import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!ObjectId.isValid(session.userId)) {
      return NextResponse.json(
        { error: 'Invalid user session' },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
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
      },
    });
  } catch (error: any) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error?.message },
      { status: 500 }
    );
  }
}
