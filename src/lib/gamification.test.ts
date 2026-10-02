import { describe, expect, it } from 'vitest';
import { badgeTier, BADGES, computeXp, earnedBadgeKeys, lastNDays, levelFor, tierName, weekStrip } from './gamification';

const s = { startDate: '2026-09-28', restDay: 0 };

describe('gamification', () => {
  it('computes XP from all activity types', () => {
    expect(computeXp({ minutes: 90, lessons: 2, modulesDone: 1, milestonesDone: 1, careerDone: 2, reviews: 4, quests: 3, bosses: 1, explained: 2, builds: 1 })).toBe(
      90 + 20 + 150 + 100 + 50 + 20 + 60 + 200 + 50 + 50,
    );
  });

  it('maps XP to levels with progress to the next one', () => {
    expect(levelFor(0)).toMatchObject({ level: 1, progress: 0 });
    expect(levelFor(450).current.title).toBe('Python Wrangler');
    expect(levelFor(450).progress).toBeCloseTo(0.25);
    expect(levelFor(50_000)).toMatchObject({ level: 8, progress: 1, next: undefined });
  });

  it('builds a Monday-first week strip with statuses', () => {
    const minutes = new Map([['2026-09-29', 90]]);
    const week = weekStrip('2026-10-01', s, minutes).map((d) => d.status);
    expect(week).toEqual(['missed', 'done', 'missed', 'today', 'future', 'future', 'rest']);
    expect(weekStrip('2026-10-01', s, minutes, new Set(['2026-09-28']))[0]!.status).toBe('frozen');
  });

  it('marks days before the start date as n/a', () => {
    expect(weekStrip('2026-09-28', { startDate: '2026-09-30', restDay: 0 }, new Map())[0]!.status).toBe('na');
  });

  it('returns the last N days ending today', () => {
    const days = lastNDays(new Map([['2026-10-01', 30]]), '2026-10-01', 3);
    expect(days.map((d) => d.minutes)).toEqual([0, 0, 30]);
  });

  it('unlocks badge tiers from progress', () => {
    const none = { logsCount: 0, totalMinutes: 0, bestStreak: 0, modulesDone: 0, phasesDone: 0, perfectQuizzes: 0, milestonesDone: 0, capstoneDone: false, reviews: 0, freezesUsed: 0, questsDone: 0, bossesPassed: 0 };
    expect(earnedBadgeKeys(none)).toEqual([]);
    const some = { ...none, logsCount: 1, bestStreak: 7, totalMinutes: 600 };
    expect(earnedBadgeKeys(some)).toEqual(['first-session:1', 'streak:1', 'streak:2', 'hours:1']);
    const streak = BADGES.find((b) => b.id === 'streak')!;
    expect(badgeTier(streak, { ...none, bestStreak: 21 })).toBe(3);
    expect(tierName(streak, 2)).toBe('Silver');
    expect(tierName(BADGES[0]!, 1)).toBeUndefined();
    expect(earnedBadgeKeys({ ...none, reviews: 50, freezesUsed: 1 })).toEqual(['recall:1', 'freeze-saved:1']);
    expect(earnedBadgeKeys({ ...none, questsDone: 25, bossesPassed: 1 })).toEqual(['quests:1', 'quests:2', 'boss:1']);
  });
});
