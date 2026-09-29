import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/leaderboard
 *
 * Query params:
 *   page    - page number, 1-indexed (default: 1)
 *   limit   - items per page (default: 10, max: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10) || 10));
    const skip = (page - 1) * limit;

    const { db } = await connectToDatabase();

    const [users, total] = await Promise.all([
      db.collection('users')
        .find({ isVerified: true })
        .sort({ points: -1 })
        .skip(skip)
        .limit(limit)
        .project({
          _id: 1,
          fullName: 1,
          points: 1,
          level: 1,
          badges: 1,
        })
        .toArray(),
      db.collection('users').countDocuments({ isVerified: true }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({ err: error }, 'Leaderboard error');
    return NextResponse.json(
      { message: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}