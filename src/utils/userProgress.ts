import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { calculateLevel, computeBadges, getLevelProgress, BADGES } from '@/lib/gamification';
import logger from '@/lib/logger';

export { calculateLevel, getLevelProgress, computeBadges, BADGES };
export type { BadgeDefinition } from '@/lib/gamification';

/**
 * Atomically update user progress in database (points, level, badges)
 */
export async function updateUserProgress(
  userId: string,
  newTotalPoints: number
): Promise<{
  levelUp: boolean;
  newLevel: number;
  newBadges: string[];
} | null> {
  if (!ObjectId.isValid(userId)) return null;

  try {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return null;

    const currentLevel = user.level || 1;
    const currentBadges = Array.isArray(user.badges) ? user.badges : [];
    const totalTrips = user.totalTrips || 0;

    const newLevel = calculateLevel(newTotalPoints);
    const { allBadges, newBadges } = computeBadges(newTotalPoints, totalTrips, currentBadges);

    const hasLevelChanged = newLevel !== currentLevel;
    const hasBadgesChanged = newBadges.length > 0;

    if (hasLevelChanged || hasBadgesChanged) {
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            level: newLevel,
            badges: allBadges,
            updatedAt: new Date(),
          },
        }
      );

      return {
        levelUp: newLevel > currentLevel,
        newLevel,
        newBadges,
      };
    }

    return null;
  } catch (error) {
    logger.error({ err: error, userId }, 'Error updating user gamification progress');
    return null;
  }
}