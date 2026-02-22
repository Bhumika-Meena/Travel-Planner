import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    // Get top 10 users by points
    const users = await db.collection('users')
      .find({ isVerified: true })
      .sort({ points: -1 })
      .limit(10)
      .project({ 
        _id: 1, 
        fullName: 1, 
        points: 1,
        level: 1,
        badges: 1
      })
      .toArray();

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
} 