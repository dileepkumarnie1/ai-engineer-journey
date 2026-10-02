import { describe, expect, it } from 'vitest';
import { courses } from '@/content/courses';
import { getModule } from '@/content';
import type { CourseProgress, ModuleProgress } from '@/db/db';
import {
  courseCompletion,
  getLessons,
  moduleCompletion,
  readinessScore,
  streakInfo,
} from './progress';
import { engagementScore, sortCourses } from './scoring';

const s = { startDate: '2026-09-28', restDay: 0 };

describe('lessons & completion', () => {
  it('uses explicit lessons or derives ~1h sessions', () => {
    expect(getLessons(courses.kaggleIntroMl)).toHaveLength(7);
    expect(getLessons(courses.nn3b1b)).toEqual(['Watch / complete it']);
    expect(getLessons(courses.micrograd)).toHaveLength(3);
  });

  it('caps lesson-based module completion at 90% until marked done', () => {
    const m = getModule('p2-ml')!;
    const lessons = getLessons(courses.kaggleIntroMl);
    const cp = new Map<string, CourseProgress>([
      [courses.kaggleIntroMl.id, { courseId: courses.kaggleIntroMl.id, lessonsDone: lessons.map((_, i) => i) }],
    ]);
    const mp = new Map<string, ModuleProgress>([
      ['p2-ml', { moduleId: 'p2-ml', status: 'in-progress', selectedCourseIds: [courses.kaggleIntroMl.id], notes: '' }],
    ]);
    expect(courseCompletion(courses.kaggleIntroMl, cp)).toBe(1);
    expect(moduleCompletion(m, mp, cp)).toBeCloseTo(0.9);
    mp.set('p2-ml', { ...mp.get('p2-ml')!, status: 'done' });
    expect(moduleCompletion(m, mp, cp)).toBe(1);
  });

  it('ignores out-of-range lesson indexes', () => {
    const cp = new Map([[courses.nn3b1b.id, { courseId: courses.nn3b1b.id, lessonsDone: [0, 5, 9] }]]);
    expect(courseCompletion(courses.nn3b1b, cp)).toBe(1);
  });
});

describe('streaks', () => {
  it('does not break on rest days and gives today grace', () => {
    // Fri, Sat logged; Sun rest; Mon (today) not yet logged
    const minutes = new Map([
      ['2026-10-02', 90],
      ['2026-10-03', 60],
    ]);
    expect(streakInfo(minutes, '2026-10-05', s).current).toBe(2);
  });

  it('breaks on a missed study day', () => {
    const minutes = new Map([
      ['2026-09-29', 90],
      ['2026-10-01', 90],
    ]);
    expect(streakInfo(minutes, '2026-10-01', s)).toMatchObject({ current: 1, best: 1, freezes: 0, frozen: [] });
  });

  it('earns a freeze every 7 study days and spends it on a missed day', () => {
    // Mon 28 Sep … Sat 3 Oct + Mon 5 Oct = 7 study days (Sun is rest), miss Tue 6 Oct, study Wed 7 Oct.
    const days = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-05', '2026-10-07'];
    const info = streakInfo(new Map(days.map((d) => [d, 30])), '2026-10-07', s);
    expect(info).toMatchObject({ current: 8, best: 8, freezes: 0, frozen: ['2026-10-06'] });
  });
});

describe('scores', () => {
  it('weights readiness 50/30/20', () => {
    expect(readinessScore(1, 0, 0)).toBe(50);
    expect(readinessScore(1, 1, 1)).toBe(100);
    expect(readinessScore(0.5, 0.5, 0)).toBe(40);
  });

  it('ranks interactive + visual courses above plain docs', () => {
    expect(engagementScore(courses.tfPlayground)).toBeGreaterThan(engagementScore(courses.httpx));
    const sorted = sortCourses([courses.httpx, courses.tfPlayground, courses.pytest]);
    expect(sorted[0]).toBe(courses.tfPlayground);
    expect(engagementScore({ interactivity: 5, visual: 5, handsOn: 5, popularity: 5 })).toBe(100);
  });
});
