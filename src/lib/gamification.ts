export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (points: number, totalTrips: number) => boolean;
}

export const BADGES: BadgeDefinition[] = [
  {
    id: 'first_step',
    name: 'First Step',
    description: 'Completed your first exploration activity',
    icon: '🧭',
    condition: (points) => points >= 2,
  },
  {
    id: 'pathfinder',
    name: 'Pathfinder',
    description: 'Reached 50 exploration points',
    icon: '🗺️',
    condition: (points) => points >= 50,
  },
  {
    id: 'urban_explorer',
    name: 'Urban Explorer',
    description: 'Reached 100 exploration points',
    icon: '🏙️',
    condition: (points) => points >= 100,
  },
  {
    id: 'globe_trotter',
    name: 'Globe Trotter',
    description: 'Reached 250 exploration points',
    icon: '✈️',
    condition: (points) => points >= 250,
  },
  {
    id: 'master_adventurer',
    name: 'Master Adventurer',
    description: 'Reached 500 exploration points',
    icon: '🏔️',
    condition: (points) => points >= 500,
  },
  {
    id: 'trailblazer',
    name: 'Trailblazer',
    description: 'Reached 1,000 exploration points',
    icon: '🚀',
    condition: (points) => points >= 1000,
  },
  {
    id: 'legendary_voyager',
    name: 'Legendary Voyager',
    description: 'Reached 2,500 exploration points',
    icon: '👑',
    condition: (points) => points >= 2500,
  },
  {
    id: 'bon_voyage',
    name: 'Bon Voyage',
    description: 'Completed your first full trip itinerary',
    icon: '🎒',
    condition: (_, totalTrips) => totalTrips >= 1,
  },
  {
    id: 'frequent_flyer',
    name: 'Frequent Flyer',
    description: 'Completed 3 full travel itineraries',
    icon: '🛫',
    condition: (_, totalTrips) => totalTrips >= 3,
  },
  {
    id: 'seasoned_nomad',
    name: 'Seasoned Nomad',
    description: 'Completed 5 full travel itineraries',
    icon: '🏕️',
    condition: (_, totalTrips) => totalTrips >= 5,
  },
];

// Level thresholds by points
const LEVEL_THRESHOLDS = [
  0,     // Level 1: 0-99
  100,   // Level 2: 100-249
  250,   // Level 3: 250-449
  450,   // Level 4: 450-699
  700,   // Level 5: 700-999
  1000,  // Level 6: 1000-1399
  1400,  // Level 7: 1400-1899
  1900,  // Level 8: 1900-2499
  2500,  // Level 9: 2500-3499
  3500,  // Level 10: 3500+
];

/**
 * Calculate user level based on authoritative points scale
 */
export function calculateLevel(points: number): number {
  if (points < 0) return 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      if (i === LEVEL_THRESHOLDS.length - 1) {
        // Beyond Level 10: +1 level per 1,500 points
        const extra = Math.floor((points - LEVEL_THRESHOLDS[i]) / 1500);
        return 10 + extra;
      }
      return i + 1;
    }
  }
  return 1;
}

/**
 * Get progress details towards next level
 */
export function getLevelProgress(points: number): {
  currentLevel: number;
  nextLevel: number;
  currentPoints: number;
  thresholdStart: number;
  thresholdEnd: number;
  progressPercent: number;
} {
  const currentLevel = calculateLevel(points);
  const nextLevel = currentLevel + 1;

  let thresholdStart = 0;
  let thresholdEnd = 100;

  if (currentLevel <= LEVEL_THRESHOLDS.length) {
    thresholdStart = LEVEL_THRESHOLDS[currentLevel - 1];
    thresholdEnd = LEVEL_THRESHOLDS[currentLevel] || thresholdStart + 1500;
  } else {
    thresholdStart = 3500 + (currentLevel - 10) * 1500;
    thresholdEnd = thresholdStart + 1500;
  }

  const range = thresholdEnd - thresholdStart;
  const earnedInRange = Math.max(0, points - thresholdStart);
  const progressPercent = Math.min(100, Math.round((earnedInRange / range) * 100));

  return {
    currentLevel,
    nextLevel,
    currentPoints: points,
    thresholdStart,
    thresholdEnd,
    progressPercent,
  };
}

/**
 * Compute eligible badges for given points and totalTrips
 */
export function computeBadges(points: number, totalTrips: number, existingBadges: string[] = []): {
  allBadges: string[];
  newBadges: string[];
} {
  const badgeSet = new Set<string>(existingBadges);
  const newBadges: string[] = [];

  for (const b of BADGES) {
    if (b.condition(points, totalTrips)) {
      if (!badgeSet.has(b.name)) {
        badgeSet.add(b.name);
        newBadges.push(b.name);
      }
    }
  }

  return {
    allBadges: Array.from(badgeSet),
    newBadges,
  };
}

/**
 * Server-authoritative task reward calculation.
 * Client-submitted points are NEVER trusted.
 * Standard activity completion awards authoritative points (default 10, up to 15 for comprehensive tasks).
 */
export function calculateTaskReward(place?: { name?: string; description?: string; points?: number }): number {
  if (!place) return 10;
  
  // Deterministic server-side evaluation based on task detail:
  const descLen = (place.description || '').length;
  if (descLen >= 100) return 15;
  if (descLen >= 50) return 12;
  return 10;
}


