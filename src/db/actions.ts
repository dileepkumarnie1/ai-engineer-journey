import { db, DEFAULT_SETTINGS, type Application, type ApplicationStatus, type MilestoneStatus, type ModuleProgress, type ModuleStatus, type Settings } from './db';
import type { ISODate } from '@/lib/dates';

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

export const setModuleStatus = (moduleId: string, status: ModuleStatus) =>
  updateModule(moduleId, (p) => ({
    ...p,
    status,
    startedAt: p.startedAt ?? (status !== 'not-started' ? now() : undefined),
    completedAt: status === 'done' ? now() : undefined,
  }));

export const saveQuizScore = (moduleId: string, score: number) =>
  updateModule(moduleId, (p) => ({ ...p, quizScore: Math.max(p.quizScore ?? 0, score) }));

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
