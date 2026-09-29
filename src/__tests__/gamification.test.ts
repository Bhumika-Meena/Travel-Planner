/**
 * Unit tests for gamification logic (calculateTaskReward, calculateLevel, computeBadges, getLevelProgress).
 * These are pure functions with no side-effects – no DB mocking needed.
 */
import {
  calculateTaskReward,
  calculateLevel,
  computeBadges,
  getLevelProgress,
  BADGES,
} from '@/lib/gamification';

// ─────────────────────────── calculateTaskReward ────────────────────────────

describe('calculateTaskReward', () => {
  it('returns 10 for undefined place', () => {
    expect(calculateTaskReward(undefined)).toBe(10);
  });

  it('returns 10 for a place with short description (< 50 chars)', () => {
    expect(calculateTaskReward({ name: 'Eiffel Tower', description: 'Nice view' })).toBe(10);
  });

  it('returns 10 for a place with no description', () => {
    expect(calculateTaskReward({ name: 'Test', description: '' })).toBe(10);
  });

  it('returns 12 for a place with medium description (50–99 chars)', () => {
    const desc = 'A'.repeat(50);
    expect(calculateTaskReward({ description: desc })).toBe(12);
  });

  it('returns 15 for a place with long description (>= 100 chars)', () => {
    const desc = 'A'.repeat(100);
    expect(calculateTaskReward({ description: desc })).toBe(15);
  });

  it('ignores client-submitted points field entirely', () => {
    // Client passes 999 – server must ignore it
    expect(calculateTaskReward({ description: 'Short', points: 999 })).toBe(10);
  });
});

// ─────────────────────────── calculateLevel ─────────────────────────────────

describe('calculateLevel', () => {
  it('returns 1 for 0 points', () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it('returns 1 for negative points', () => {
    expect(calculateLevel(-50)).toBe(1);
  });

  it('returns 2 at 100 points (threshold boundary)', () => {
    expect(calculateLevel(100)).toBe(2);
  });

  it('returns 1 just below 100 points', () => {
    expect(calculateLevel(99)).toBe(1);
  });

  it('returns 3 at 250 points', () => {
    expect(calculateLevel(250)).toBe(3);
  });

  it('returns 10 at 3500 points', () => {
    expect(calculateLevel(3500)).toBe(10);
  });

  it('returns 11 at 5000 points (beyond level 10)', () => {
    expect(calculateLevel(5000)).toBe(11);
  });
});

// ─────────────────────────── getLevelProgress ───────────────────────────────

describe('getLevelProgress', () => {
  it('returns valid progress structure for 0 points', () => {
    const result = getLevelProgress(0);
    expect(result).toMatchObject({
      currentLevel: 1,
      nextLevel: 2,
      currentPoints: 0,
      progressPercent: 0,
    });
  });

  it('progressPercent is clamped between 0 and 100', () => {
    const result = getLevelProgress(10000);
    expect(result.progressPercent).toBeGreaterThanOrEqual(0);
    expect(result.progressPercent).toBeLessThanOrEqual(100);
  });

  it('thresholdEnd > thresholdStart (valid range)', () => {
    const result = getLevelProgress(250);
    expect(result.thresholdEnd).toBeGreaterThan(result.thresholdStart);
  });
});

// ─────────────────────────── computeBadges ──────────────────────────────────

describe('computeBadges', () => {
  it('awards first_step badge at 2 points', () => {
    const { allBadges, newBadges } = computeBadges(2, 0, []);
    expect(newBadges).toContain('First Step');
    expect(allBadges).toContain('First Step');
  });

  it('does not re-award a badge the user already has', () => {
    const { newBadges } = computeBadges(100, 0, ['First Step', 'Pathfinder']);
    expect(newBadges).not.toContain('Pathfinder');
  });

  it('awards trip-based badge when totalTrips threshold met', () => {
    const { newBadges } = computeBadges(0, 1, []);
    expect(newBadges).toContain('Bon Voyage');
  });

  it('returns empty newBadges when no new badges earned', () => {
    const { newBadges } = computeBadges(0, 0, []);
    expect(newBadges).toHaveLength(0);
  });

  it('returns allBadges including previously earned ones', () => {
    const existing = ['First Step'];
    const { allBadges } = computeBadges(50, 0, existing);
    expect(allBadges).toContain('First Step');
    expect(allBadges).toContain('Pathfinder');
  });

  it('all BADGES have unique ids', () => {
    const ids = BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
