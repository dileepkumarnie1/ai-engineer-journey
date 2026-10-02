import { describe, expect, it } from 'vitest';
import { allModules, getModule } from '@/content';
import type { ModuleProgress } from '@/db/db';
import { moduleMastery, skillLevel, SKILLS, skillScores } from './skills';
import { lowSignals, shouldOfferReplan } from './wellbeing';

describe('skill map', () => {
  it('maps every skill to real modules and every core learn module to a skill', () => {
    const mapped = new Set(SKILLS.flatMap((s) => s.modules));
    for (const id of mapped) expect(getModule(id), id).toBeDefined();
    const unmapped = allModules.filter((m) => !mapped.has(m.id) && m.id.match(/^p[1-6]-/));
    expect(unmapped.map((m) => m.id)).toEqual([]);
  });

  it('rewards proven mastery over ticked boxes', () => {
    const base: ModuleProgress = { moduleId: 'p1-core', status: 'done', selectedCourseIds: [], notes: '' };
    const ticked = new Map([['p1-core', base]]);
    const proven = new Map([['p1-core', { ...base, quizScore: 100, confidence: 5 }]]);
    expect(moduleMastery('p1-core', ticked, new Map())).toBeCloseTo(0.4);
    expect(moduleMastery('p1-core', proven, new Map())).toBeCloseTo(1);
    const python = skillScores(proven, new Map()).find((s) => s.id === 'python')!;
    expect(python.score).toBe(20);
    expect(skillLevel(python.score)).toBe('Learning');
    expect(skillLevel(85)).toBe('Job-ready');
  });
});

describe('wellbeing', () => {
  const logs = [
    { date: '2026-10-01', minutes: 30, mood: 2, createdAt: '' },
    { date: '2026-09-20', minutes: 30, mood: 1, createdAt: '' },
  ];

  it('counts recent low energy and low mood', () => {
    expect(lowSignals([{ date: '2026-10-02', energy: 1 }, { date: '2026-10-01', energy: 3 }], logs, '2026-10-02')).toBe(2);
  });

  it('offers the 120-day plan only when behind AND running low, and respects dismissal', () => {
    const o = { pace: -4, targetDays: 90, lowSignals: 2, today: '2026-10-02' };
    expect(shouldOfferReplan(o)).toBe(true);
    expect(shouldOfferReplan({ ...o, pace: -1 })).toBe(false);
    expect(shouldOfferReplan({ ...o, lowSignals: 1 })).toBe(false);
    expect(shouldOfferReplan({ ...o, targetDays: 120 })).toBe(false);
    expect(shouldOfferReplan({ ...o, dismissedUntil: '2026-10-05' })).toBe(false);
  });
});
