import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectDB();

    const session = await getAuthSession(request);
    const userId = session?.userId;
    if (!userId) {
      return NextResponse.json(
        { message: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get user's stats
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's rank
    const userRank = await User.countDocuments({ points: { $gt: user.points || 0 } }) + 1;

    const stats = {
      totalPoints: user.points || 0,
      totalTrips: Array.isArray(user.trips) ? user.trips.length : 0,
      rank: userRank,
    };

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('User stats error:', error);
    return NextResponse.json(
      { message: 'Error fetching user stats' },
      { status: 500 }
    );
  }
} 