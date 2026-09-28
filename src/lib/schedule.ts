import type { Phase } from '@/content/schema';
import { addDays, diffDays, weekday, type ISODate } from './dates';

export interface ScheduleSettings {
  startDate: ISODate;
  /** 0 = Sunday … 6 = Saturday; null = study every day. */
  restDay: number | null;
}

export interface PlannedModule {
  moduleId: string;
  phaseId: string;
  startIndex: number;
  endIndex: number;
  startDate: ISODate;
  endDate: ISODate;
  buffer: boolean;
}

export const isStudyDay = (date: ISODate, s: ScheduleSettings): boolean =>
  s.restDay === null || weekday(date) !== s.restDay;

/** Number of study days in [from, to). */
export const studyDaysBetween = (from: ISODate, to: ISODate, s: ScheduleSettings): number => {
  const span = diffDays(from, to);
  if (span <= 0) return 0;
  if (s.restDay === null) return span;
  let count = 0;
  for (let i = 0; i < span; i++) if (isStudyDay(addDays(from, i), s)) count++;
  return count;
};

/** Date of the study day with zero-based index `n`, counting from `from` (inclusive). */
export const nthStudyDay = (from: ISODate, n: number, s: ScheduleSettings): ISODate => {
  let d = from;
  let seen = -1;
  for (;;) {
    if (isStudyDay(d, s)) seen++;
    if (seen >= n) return d;
    d = addDays(d, 1);
  }
};

export const buildPlan = (phases: Phase[], s: ScheduleSettings): PlannedModule[] => {
  const plan: PlannedModule[] = [];
  let idx = 0;
  for (const phase of phases) {
    for (const m of phase.modules) {
      const startIndex = idx;
      idx += m.studyDays;
      plan.push({
        moduleId: m.id,
        phaseId: phase.id,
        startIndex,
        endIndex: idx,
        startDate: nthStudyDay(s.startDate, startIndex, s),
        endDate: nthStudyDay(s.startDate, idx - 1, s),
        buffer: Boolean(phase.buffer),
      });
    }
  }
  return plan;
};

/** Study days that should be finished before `today` begins. */
export const plannedDoneBy = (today: ISODate, s: ScheduleSettings): number =>
  studyDaysBetween(s.startDate, today, s);

export const planForDate = (
  plan: PlannedModule[],
  date: ISODate,
  s: ScheduleSettings,
): PlannedModule | null => {
  if (diffDays(s.startDate, date) < 0 || !isStudyDay(date, s)) return null;
  const idx = plannedDoneBy(date, s);
  return plan.find((p) => idx >= p.startIndex && idx < p.endIndex) ?? null;
};

export const calendarDay = (today: ISODate, s: ScheduleSettings): number =>
  diffDays(s.startDate, today) + 1;

/**
 * Projects the finish date of `total` study days given actual progress so far.
 * Uses observed velocity once there are at least 5 elapsed study days.
 */
export const projectFinish = (
  today: ISODate,
  s: ScheduleSettings,
  actualDone: number,
  total: number,
): ISODate | null => {
  const remaining = total - actualDone;
  if (remaining <= 0.001) return null;
  const elapsed = plannedDoneBy(today, s);
  const velocity = elapsed >= 5 ? Math.min(3, Math.max(0.2, actualDone / elapsed)) : 1;
  const needed = Math.ceil(remaining / velocity);
  const from = diffDays(s.startDate, today) < 0 ? s.startDate : today;
  return nthStudyDay(from, needed - 1, s);
};
