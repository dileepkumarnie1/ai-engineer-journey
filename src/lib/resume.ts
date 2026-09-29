import type { Course, LearningModule } from '@/content/schema';
import type { DailyLog } from '@/db/db';
import { getLessons, type CourseProgressMap, type ModuleProgressMap } from './progress';
import { sortCourses } from './scoring';

export type ResumeMode = 'start' | 'pick' | 'continue' | 'finish';

export interface ResumeTarget {
  module: LearningModule;
  mode: ResumeMode;
  course?: Course;
  lessonIndex?: number;
  lessonLabel?: string;
  courseProgress: number;
  recommended: Course;
  /** Section on the module page to jump to. */
  hash: '#pick' | '#my-plan' | '#complete';
  isNewUser: boolean;
}

export const isNewUser = (mp: ModuleProgressMap, cp: CourseProgressMap, logs: DailyLog[]) =>
  logs.length === 0 &&
  [...mp.values()].every((p) => p.status === 'not-started' && p.selectedCourseIds.length === 0) &&
  [...cp.values()].every((c) => c.lessonsDone.length === 0);

/** Works out the single best "continue here" action for the learner. */
export const getResumeTarget = (
  ordered: LearningModule[],
  mp: ModuleProgressMap,
  cp: CourseProgressMap,
  logs: DailyLog[],
): ResumeTarget | null => {
  const notDone = (m?: LearningModule): m is LearningModule => !!m && mp.get(m.id)?.status !== 'done';
  const byId = (id?: string) => ordered.find((m) => m.id === id);
  const lastLogged = [...logs].reverse().find((l) => l.moduleId && notDone(byId(l.moduleId)));

  const module =
    byId(lastLogged?.moduleId) ??
    ordered.find((m) => mp.get(m.id)?.status === 'in-progress') ??
    ordered.find(notDone);
  if (!module) return null;

  const fresh = isNewUser(mp, cp, logs);
  const recommended = sortCourses(module.courses)[0]!;
  const selectedIds = mp.get(module.id)?.selectedCourseIds ?? [];
  const selected = selectedIds
    .map((id) => module.courses.find((c) => c.id === id))
    .filter((c): c is Course => !!c);

  if (!selected.length) {
    return { module, mode: fresh ? 'start' : 'pick', courseProgress: 0, recommended, hash: '#pick', isNewUser: fresh };
  }

  for (const course of selected) {
    const lessons = getLessons(course);
    const done = new Set(cp.get(course.id)?.lessonsDone ?? []);
    const next = lessons.findIndex((_, i) => !done.has(i));
    if (next >= 0) {
      return {
        module,
        mode: 'continue',
        course,
        lessonIndex: next,
        lessonLabel: lessons[next],
        courseProgress: done.size / lessons.length,
        recommended,
        hash: '#my-plan',
        isNewUser: false,
      };
    }
  }

  return { module, mode: 'finish', course: selected[0], courseProgress: 1, recommended, hash: '#complete', isNewUser: false };
};
