import { db, DEFAULT_SETTINGS, type Application, type ApplicationStatus, type MilestoneStatus, type ModuleProgress, type ModuleStatus, type Settings } from './db';
import { todayISO, type ISODate } from '@/lib/dates';
import { masteryCheck } from '@/lib/quiz';
import { gradeCard, isRecallKey } from '@/lib/leitner';

const now = () => new Date().toISOString();

const emptyProgress = (moduleId: string): ModuleProgress => ({
  moduleId,
  status: 'not-started',
  selectedCourseIds: [],
  notes: '',
});

const updateModule = async (moduleId: string, fn: (p: ModuleProgress) => ModuleProgress) => {
  await db.transaction('rw', db.moduleProgress, async () => {
    const current = (await db.moduleProgress.get(moduleId)) ?? emptyProgress(moduleId);
    await db.moduleProgress.put(fn(current));
  });
};

export const saveSettings = async (patch: Partial<Omit<Settings, 'key'>>) => {
  const current = (await db.settings.get('app')) ?? DEFAULT_SETTINGS;
  await db.settings.put({ ...current, ...patch, key: 'app' });
};

export const toggleCourseSelection = (moduleId: string, courseId: string) =>
  updateModule(moduleId, (p) => {
    const selected = p.selectedCourseIds.includes(courseId)
      ? p.selectedCourseIds.filter((id) => id !== courseId)
      : [...p.selectedCourseIds, courseId];
    const status: ModuleStatus = p.status === 'not-started' && selected.length ? 'in-progress' : p.status;
    return { ...p, selectedCourseIds: selected, status, startedAt: p.startedAt ?? now() };
  });

export const setModuleStatus = (moduleId: string, status: Exclude<ModuleStatus, 'done'>) =>
  updateModule(moduleId, (p) => ({
    ...p,
    status,
    startedAt: p.startedAt ?? (status !== 'not-started' ? now() : undefined),
    completedAt: undefined,
  }));

/** Marks a module done only once the mastery check passes. Returns whether it was completed. */
export const completeModule = async (moduleId: string): Promise<boolean> => {
  let completed = false;
  await updateModule(moduleId, (p) => {
    if (!masteryCheck(p).ready) return p;
    completed = true;
    return { ...p, status: 'done', startedAt: p.startedAt ?? now(), completedAt: now() };
  });
  return completed;
};

export const recordQuizAttempt = async (
  moduleId: string,
  score: number,
  results: { key: string; correct: boolean }[],
  today: ISODate = todayISO(),
) => {
  await db.transaction('rw', db.moduleProgress, db.quizAttempts, db.reviewCards, async () => {
    const p = (await db.moduleProgress.get(moduleId)) ?? emptyProgress(moduleId);
    await db.moduleProgress.put({
      ...p,
      quizScore: Math.max(p.quizScore ?? 0, score),
      status: p.status === 'not-started' ? 'in-progress' : p.status,
      startedAt: p.startedAt ?? now(),
    });
    await db.quizAttempts.add({ moduleId, at: now(), score, wrong: results.filter((r) => !r.correct).map((r) => r.key) });
    for (const r of results.filter((x) => isRecallKey(x.key))) {
      await db.reviewCards.put(gradeCard(await db.reviewCards.get(r.key), r.key, r.correct, today));
    }
  });
};

export const reviewRecallCard = async (id: string, correct: boolean, today: ISODate = todayISO()) => {
  await db.transaction('rw', db.reviewCards, async () => {
    await db.reviewCards.put(gradeCard(await db.reviewCards.get(id), id, correct, today));
  });
};

export const setConfidence = (moduleId: string, confidence: number) =>
  updateModule(moduleId, (p) => ({ ...p, confidence }));

export const setNotes = (moduleId: string, notes: string) =>
  updateModule(moduleId, (p) => ({ ...p, notes: notes.slice(0, 5000) }));

export const toggleLesson = async (courseId: string, index: number) => {
  await db.transaction('rw', db.courseProgress, async () => {
    const current = (await db.courseProgress.get(courseId)) ?? { courseId, lessonsDone: [] };
    const lessonsDone = current.lessonsDone.includes(index)
      ? current.lessonsDone.filter((i) => i !== index)
      : [...current.lessonsDone, index].sort((a, b) => a - b);
    await db.courseProgress.put({ courseId, lessonsDone });
  });
};

export const addLog = (entry: { date: ISODate; minutes: number; moduleId?: string; mood?: number; note?: string }) =>
  db.logs.add({
    ...entry,
    minutes: Math.max(1, Math.min(600, Math.round(entry.minutes))),
    note: entry.note?.slice(0, 280),
    createdAt: now(),
  });

export const deleteLog = (id: number) => db.logs.delete(id);

export const setMilestoneStatus = (id: string, status: MilestoneStatus) =>
  db.milestones.put({ id, status, updatedAt: now() });

export const toggleCareer = async (id: string) => {
  const current = await db.career.get(id);
  await db.career.put({ id, done: !current?.done });
};

export const addApplication = (a: Omit<Application, 'id'>) => db.applications.add(a);

export const updateApplicationStatus = (id: number, status: ApplicationStatus) =>
  db.applications.update(id, { status });

export const deleteApplication = (id: number) => db.applications.delete(id);

export const toggleWatched = async (id: string) => {
  if (await db.watched.get(id)) await db.watched.delete(id);
  else await db.watched.put({ id, watchedAt: now() });
};
