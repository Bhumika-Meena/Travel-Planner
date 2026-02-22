import { connectToDatabase } from '@/lib/mongodb';

export async function updateUserProgress(userId: string, newPoints: number) {
  const { db } = await connectToDatabase();
  
  try {
    // Get current user data
    const user = await db.collection('users').findOne({ _id: userId });
    if (!user) return;

    const currentLevel = user.level || 1;
    const currentPoints = user.points || 0;
    const currentTrips = user.totalTrips || 0;
    const currentBadges = user.badges || [];

    // Calculate new level based on trips
    const newLevel = Math.floor(currentTrips / 5) + 1;
    
    // Calculate new badges based on points
    const newBadges = [...currentBadges];
    const pointsForBadge = 50;
    const totalBadges = Math.floor(newPoints / pointsForBadge);
    
    for (let i = 1; i <= totalBadges; i++) {
      const badgeName = `Explorer ${i}`;
      if (!newBadges.includes(badgeName)) {
        newBadges.push(badgeName);
      }
    }

    // Only update if there are changes
    if (newLevel !== currentLevel || newBadges.length !== currentBadges.length) {
      await db.collection('users').updateOne(
        { _id: userId },
        {
          $set: {
            level: newLevel,
            badges: newBadges
          }
        }
      );

      return {
        levelUp: newLevel > currentLevel,
        newBadges: newBadges.filter(badge => !currentBadges.includes(badge))
      };
    }

    return null;
  } catch (error) {
    console.error('Error updating user progress:', error);
    return null;
  }
} 