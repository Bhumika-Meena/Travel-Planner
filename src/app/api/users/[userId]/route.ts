import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    // Validate user ID format
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Find the user
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          _id: 1,
          fullName: 1,
          email: 1,
          profilePicture: 1,
          points: 1,
          level: 1,
          badges: 1,
          totalTrips: 1,
          bio: 1,
          currentTrip: 1
        }
      }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get current trip
    const currentTrip = await db.collection('trips').findOne(
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

    return NextResponse.json({
      ...user,
      currentTrip: currentTrip || null
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = request.headers.get('user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Verify that the requested userId matches the authenticated user
    if (userId !== params.userId) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    const { db } = await connectToDatabase();

    // Validate ObjectId
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    // Get request body
    const body = await request.json();
    const { fullName, email, bio } = body;

    // Validate required fields
    if (!fullName || !email) {
      return NextResponse.json(
        { error: 'Full name and email are required' },
        { status: 400 }
      );
    }

    // Update user data
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { fullName, email, bio } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get updated user data
    const updatedUser = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { _id: 1, fullName: 1, email: 1, points: 1, profilePicture: 1, level: 1, badges: 1, bio: 1 } }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get total trips count
    const totalTrips = await db.collection('trips').countDocuments({
      userId: new ObjectId(userId)
    });

    // Get current trip
    const currentTrip = await db.collection('trips').findOne(
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

    // Return updated user data
    const userData = {
      _id: updatedUser._id.toString(),
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      points: updatedUser.points || 0,
      profilePicture: updatedUser.profilePicture || null,
      level: updatedUser.level || 1,
      badges: updatedUser.badges || [],
      bio: updatedUser.bio || '',
      totalTrips,
      currentTrip: currentTrip || null
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error updating user data:', error);
    return NextResponse.json(
      { error: 'Failed to update user data' },
      { status: 500 }
    );
  }
} 