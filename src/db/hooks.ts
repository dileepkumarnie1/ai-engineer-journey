import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { db, DEFAULT_SETTINGS, type Checkin, type CourseProgress, type ModuleProgress, type ReviewCard } from './db';

export const useSettings = () => useLiveQuery(() => db.settings.get('app'), []) ?? DEFAULT_SETTINGS;

export const useModuleProgressMap = () => {
  const rows = useLiveQuery(() => db.moduleProgress.toArray(), []);
  return useMemo(() => new Map<string, ModuleProgress>((rows ?? []).map((r) => [r.moduleId, r])), [rows]);
};

export const useCourseProgressMap = () => {
  const rows = useLiveQuery(() => db.courseProgress.toArray(), []);
  return useMemo(() => new Map<string, CourseProgress>((rows ?? []).map((r) => [r.courseId, r])), [rows]);
};

export const useLogs = () => useLiveQuery(() => db.logs.orderBy('date').toArray(), []) ?? [];

export const useMilestoneMap = () => {
  const rows = useLiveQuery(() => db.milestones.toArray(), []);
  return useMemo(() => new Map((rows ?? []).map((r) => [r.id, r.status])), [rows]);
};

export const useCareerSet = () => {
  const rows = useLiveQuery(() => db.career.toArray(), []);
  return useMemo(() => new Set((rows ?? []).filter((r) => r.done).map((r) => r.id)), [rows]);
};

export const useApplications = () =>
  useLiveQuery(() => db.applications.orderBy('id').reverse().toArray(), []) ?? [];

export const useWatchedSet = () => {
  const rows = useLiveQuery(() => db.watched.toArray(), []);
  return useMemo(() => new Set((rows ?? []).map((r) => r.id)), [rows]);
};

const NO_CARDS: ReviewCard[] = [];
export const useReviewCards = () => useLiveQuery(() => db.reviewCards.toArray(), []) ?? NO_CARDS;

const NO_CHECKINS: Checkin[] = [];
export const useCheckins = () => useLiveQuery(() => db.checkins.toArray(), []) ?? NO_CHECKINS;

export const useQuizAttempts = (moduleId: string) =>
  useLiveQuery(() => db.quizAttempts.where('moduleId').equals(moduleId).sortBy('at'), [moduleId]) ?? [];

/** undefined while loading, so callers don't redirect before settings are read. */
export const useOnboarded = () =>
  useLiveQuery(async () => Boolean((await db.settings.get('app'))?.onboarded), []);
