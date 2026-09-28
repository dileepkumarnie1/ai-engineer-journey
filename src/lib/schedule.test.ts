import { describe, expect, it } from 'vitest';
import { phases } from '@/content';
import {
  buildPlan,
  calendarDay,
  isStudyDay,
  nthStudyDay,
  planForDate,
  plannedDoneBy,
  projectFinish,
  studyDaysBetween,
} from './schedule';

const s = { startDate: '2026-09-28', restDay: 0 }; // Monday start, Sunday rest

describe('schedule', () => {
  it('treats Sunday as a rest day', () => {
    expect(isStudyDay('2026-10-04', s)).toBe(false);
    expect(isStudyDay('2026-10-05', s)).toBe(true);
  });

  it('counts study days in a half-open range', () => {
    expect(studyDaysBetween('2026-09-28', '2026-10-05', s)).toBe(6);
    expect(studyDaysBetween('2026-09-28', '2026-09-28', s)).toBe(0);
    expect(studyDaysBetween('2026-10-05', '2026-09-28', s)).toBe(0);
  });

  it('finds the nth study day, skipping rest days', () => {
    expect(nthStudyDay('2026-09-28', 0, s)).toBe('2026-09-28');
    expect(nthStudyDay('2026-09-28', 6, s)).toBe('2026-10-05');
    expect(nthStudyDay('2026-10-04', 0, s)).toBe('2026-10-05');
  });

  it('fits the 78-day core plan inside 90 calendar days', () => {
    const plan = buildPlan(phases, s);
    const lastCore = plan.filter((p) => !p.buffer).at(-1)!;
    expect(lastCore.endIndex).toBe(78);
    expect(lastCore.endDate).toBe('2026-12-26');
    expect(calendarDay(lastCore.endDate, s)).toBe(90);
  });

  it('fits the job-ready sprint inside 120 calendar days', () => {
    const last = buildPlan(phases, s).at(-1)!;
    expect(calendarDay(last.endDate, s)).toBeLessThanOrEqual(120);
  });

  it('maps a date to its planned module', () => {
    const plan = buildPlan(phases, s);
    expect(planForDate(plan, '2026-09-28', s)?.moduleId).toBe('p0-role');
    expect(planForDate(plan, '2026-09-29', s)?.moduleId).toBe('p0-setup');
    expect(planForDate(plan, '2026-10-04', s)).toBeNull();
    expect(planForDate(plan, '2026-09-01', s)).toBeNull();
  });

  it('projects the finish date from pace', () => {
    expect(projectFinish('2026-09-28', s, 0, 78)).toBe('2026-12-26');
    // 12 elapsed study days, 6 done → half speed → later finish
    const slow = projectFinish('2026-10-12', s, 6, 78)!;
    expect(slow > '2026-12-26').toBe(true);
    expect(projectFinish('2026-10-12', s, 78, 78)).toBeNull();
    expect(plannedDoneBy('2026-10-12', s)).toBe(12);
  });

  it('supports no rest day', () => {
    const all = { startDate: '2026-09-28', restDay: null };
    expect(studyDaysBetween('2026-09-28', '2026-10-05', all)).toBe(7);
  });
});
