import { describe, expect, it } from 'vitest';
import { BADGES, computeXp, lastNDays, levelFor, weekStrip } from './gamification';

const s = { startDate: '2026-09-28', restDay: 0 };

describe('gamification', () => {
  it('computes XP from all activity types', () => {
    expect(computeXp({ minutes: 90, lessons: 2, modulesDone: 1, milestonesDone: 1, careerDone: 2, reviews: 4 })).toBe(90 + 20 + 150 + 100 + 50 + 20);
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

  it('unlocks badges from progress', () => {
    const none = { logsCount: 0, totalMinutes: 0, bestStreak: 0, modulesDone: 0, phasesDone: 0, quizAce: false, milestonesDone: 0, capstoneDone: false, reviews: 0, freezesUsed: 0 };
    expect(BADGES.filter((b) => b.earned(none))).toHaveLength(0);
    const some = { ...none, logsCount: 1, bestStreak: 3, totalMinutes: 600 };
    expect(BADGES.filter((b) => b.earned(some)).map((b) => b.id)).toEqual(['first-session', 'streak-3', 'hours-10']);
    expect(BADGES.filter((b) => b.earned({ ...none, reviews: 50, freezesUsed: 1 })).map((b) => b.id)).toEqual(['recall-50', 'freeze-saved']);
  });
});
