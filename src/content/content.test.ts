import { describe, expect, it } from 'vitest';
import { allModules, careerChecklist, corePhases, courseLibrary, phases, projects } from '@/content';
import { phaseSchema } from './schema';

describe('content integrity', () => {
  it('every phase passes schema validation', () => {
    for (const p of phases) {
      const r = phaseSchema.safeParse(p);
      expect(r.success, `${p.id}: ${r.success ? '' : JSON.stringify(r.error.issues[0])}`).toBe(true);
    }
  });

  it('has unique module ids and valid quiz answers', () => {
    const ids = allModules.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of allModules) for (const q of m.quiz) expect(q.answer).toBeLessThan(q.options.length);
  });

  it('keeps 78 core study days and a 25-day sprint', () => {
    const days = (ps: typeof phases) => ps.flatMap((p) => p.modules).reduce((s, m) => s + m.studyDays, 0);
    expect(days(corePhases)).toBe(78);
    expect(days(phases) - days(corePhases)).toBe(25);
  });

  it('reuses shared courses by identity (same id ⇒ same object)', () => {
    const seen = new Map<string, unknown>();
    for (const m of allModules)
      for (const c of m.courses) {
        if (seen.has(c.id)) expect(seen.get(c.id)).toBe(c);
        seen.set(c.id, c);
      }
    expect(courseLibrary.length).toBe(seen.size);
  });

  it('only links to https resources', () => {
    for (const { course } of courseLibrary) expect(course.url.startsWith('https://')).toBe(true);
  });

  it('has a deep video library with unique embeds and every paid item flagged', () => {
    const videos = courseLibrary.filter((e) => e.course.youtubeId);
    expect(videos.length).toBeGreaterThanOrEqual(60);
    const ids = videos.map((e) => e.course.youtubeId);
    expect(new Set(ids).size).toBe(ids.length);
    const paid = courseLibrary.filter((e) => e.course.paid).map((e) => e.course.id);
    expect(paid).toEqual(['pierian-python-bootcamp']);
  });

  it('includes both user roadmap videos and agent courses', () => {
    const ids = courseLibrary.map((e) => e.course.youtubeId);
    expect(ids).toContain('qKXUPI06tZo');
    expect(ids).toContain('YpQQY49xXhY');
    const agentCourses = courseLibrary.filter((e) => /agent/i.test(e.course.title));
    expect(agentCourses.length).toBeGreaterThanOrEqual(5);
  });

  it('project milestones and career items have unique ids and valid phases', () => {
    const ms = projects.flatMap((p) => p.milestones);
    expect(new Set(ms.map((m) => m.id)).size).toBe(ms.length);
    for (const m of ms) expect(phases.some((p) => p.id === m.phaseId)).toBe(true);
    expect(new Set(careerChecklist.map((c) => c.id)).size).toBe(careerChecklist.length);
  });
});
