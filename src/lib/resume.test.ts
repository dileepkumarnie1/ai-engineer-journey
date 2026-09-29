import { describe, expect, it } from 'vitest';
import { allModules } from '@/content';
import type { CourseProgress, DailyLog, ModuleProgress } from '@/db/db';
import { getResumeTarget } from './resume';

const mp = (rows: ModuleProgress[]) => new Map(rows.map((r) => [r.moduleId, r]));
const cp = (rows: CourseProgress[]) => new Map(rows.map((r) => [r.courseId, r]));
const log = (moduleId: string): DailyLog => ({ date: '2026-09-28', minutes: 30, moduleId, createdAt: '' });

describe('getResumeTarget', () => {
  it('sends a brand-new user to pick a course in the first module', () => {
    const t = getResumeTarget(allModules, mp([]), cp([]), [])!;
    expect(t).toMatchObject({ mode: 'start', hash: '#pick', isNewUser: true });
    expect(t.module.id).toBe('p0-role');
    expect(t.recommended).toBeDefined();
  });

  it('continues at the next unticked lesson of the selected course', () => {
    const t = getResumeTarget(
      allModules,
      mp([{ moduleId: 'p2-ml', status: 'in-progress', selectedCourseIds: ['kaggle-intro-ml'], notes: '' }]),
      cp([{ courseId: 'kaggle-intro-ml', lessonsDone: [0, 1] }]),
      [],
    )!;
    expect(t).toMatchObject({ mode: 'continue', lessonIndex: 2, lessonLabel: 'Your first ML model', hash: '#my-plan' });
    expect(t.module.id).toBe('p2-ml');
  });

  it('prefers the module from the most recent log', () => {
    const t = getResumeTarget(
      allModules,
      mp([
        { moduleId: 'p0-role', status: 'in-progress', selectedCourseIds: [], notes: '' },
        { moduleId: 'p1-apis', status: 'in-progress', selectedCourseIds: [], notes: '' },
      ]),
      cp([]),
      [log('p0-role'), log('p1-apis')],
    )!;
    expect(t.module.id).toBe('p1-apis');
    expect(t.mode).toBe('pick');
  });

  it('asks to finish when all lessons are ticked', () => {
    const t = getResumeTarget(
      allModules,
      mp([{ moduleId: 'p0-role', status: 'in-progress', selectedCourseIds: ['baraa-roadmap'], notes: '' }]),
      cp([{ courseId: 'baraa-roadmap', lessonsDone: [0] }]),
      [],
    )!;
    expect(t).toMatchObject({ mode: 'finish', hash: '#complete' });
  });

  it('skips completed modules', () => {
    const t = getResumeTarget(allModules, mp([{ moduleId: 'p0-role', status: 'done', selectedCourseIds: [], notes: '' }]), cp([]), [log('p0-role')])!;
    expect(t.module.id).toBe('p0-setup');
  });
});
