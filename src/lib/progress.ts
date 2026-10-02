import type { Course, LearningModule, Phase } from '@/content/schema';
import type { CourseProgress, DailyLog, ModuleProgress } from '@/db/db';
import { addDays, diffDays, type ISODate } from './dates';
import { isStudyDay, type ScheduleSettings } from './schedule';

const MAX_SESSIONS = 12;

/** Explicit lessons, or ~1-hour sessions derived from course length. */
export const getLessons = (course: Course): string[] => {
  if (course.lessons?.length) return course.lessons;
  const n = Math.min(MAX_SESSIONS, Math.max(1, Math.round(course.hours)));
  if (n === 1) return ['Watch / complete it'];
  return Array.from({ length: n }, (_, i) => `Session ${i + 1} · ~60 min`);
};

export type CourseProgressMap = Map<string, CourseProgress>;
export type ModuleProgressMap = Map<string, ModuleProgress>;

export const courseCompletion = (course: Course, cp: CourseProgressMap): number => {
  const total = getLessons(course).length;
  const done = (cp.get(course.id)?.lessonsDone ?? []).filter((i) => i >= 0 && i < total).length;
  return done / total;
};

// Lessons alone cap at 90%: marking the module complete gives the last 10%.
const LESSON_CAP = 0.9;

export const moduleCompletion = (
  m: LearningModule,
  mp: ModuleProgressMap,
  cp: CourseProgressMap,
): number => {
  const p = mp.get(m.id);
  if (p?.status === 'done') return 1;
  const selected = m.courses.filter((c) => p?.selectedCourseIds.includes(c.id));
  if (!selected.length) return 0;
  const avg = selected.reduce((sum, c) => sum + courseCompletion(c, cp), 0) / selected.length;
  return avg * LESSON_CAP;
};

/** Completed study-day equivalents across the given phases. */
export const studyDaysDone = (phases: Phase[], mp: ModuleProgressMap, cp: CourseProgressMap) =>
  phases
    .flatMap((p) => p.modules)
    .reduce((sum, m) => sum + m.studyDays * moduleCompletion(m, mp, cp), 0);

export const totalStudyDays = (phases: Phase[]) =>
  phases.flatMap((p) => p.modules).reduce((sum, m) => sum + m.studyDays, 0);

export const phaseCompletion = (phase: Phase, mp: ModuleProgressMap, cp: CourseProgressMap) =>
  studyDaysDone([phase], mp, cp) / totalStudyDays([phase]);

export const readinessScore = (
  learning: number,
  projects: number,
  career: number,
): number => Math.round((0.5 * learning + 0.3 * projects + 0.2 * career) * 100);

export const minutesByDate = (logs: DailyLog[]): Map<ISODate, number> => {
  const map = new Map<ISODate, number>();
  for (const l of logs) map.set(l.date, (map.get(l.date) ?? 0) + l.minutes);
  return map;
};

export const FREEZE_EVERY = 7;
export const MAX_FREEZES = 2;

export interface StreakInfo {
  current: number;
  best: number;
  /** Freezes banked for future missed days. */
  freezes: number;
  /** Missed study days covered by a freeze. */
  frozen: ISODate[];
}

/**
 * Consecutive study days with logged time. Rest days never break the streak and today is a grace day.
 * Every 7 study days earns a freeze (max 2) that automatically covers one missed study day.
 */
export const streakInfo = (minutes: Map<ISODate, number>, today: ISODate, s: ScheduleSettings): StreakInfo => {
  let current = 0;
  let best = 0;
  let freezes = 0;
  let sinceEarned = 0;
  const frozen: ISODate[] = [];
  for (let d = s.startDate; diffDays(d, today) >= 0; d = addDays(d, 1)) {
    if ((minutes.get(d) ?? 0) > 0) {
      best = Math.max(best, ++current);
      if (++sinceEarned === FREEZE_EVERY) {
        freezes = Math.min(MAX_FREEZES, freezes + 1);
        sinceEarned = 0;
      }
    } else if (d === today || !isStudyDay(d, s)) {
      continue;
    } else if (freezes > 0) {
      freezes--;
      frozen.push(d);
    } else {
      current = 0;
      sinceEarned = 0;
    }
  }
  return { current, best, freezes, frozen };
};
