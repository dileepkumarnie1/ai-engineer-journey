import { Dexie, type EntityTable } from 'dexie';
import type { ISODate } from '@/lib/dates';

export type ModuleStatus = 'not-started' | 'in-progress' | 'done';
export type MilestoneStatus = 'todo' | 'doing' | 'done';
export type ApplicationStatus = 'wishlist' | 'applied' | 'interview' | 'offer' | 'rejected';
export type SkillArea = 'python' | 'ml' | 'llm' | 'rag' | 'agents' | 'ops';
/** 0 = new to it, 1 = some experience, 2 = solid. */
export type ExperienceLevel = 0 | 1 | 2;

export interface Settings {
  key: 'app';
  name: string;
  startDate: ISODate;
  minutesPerDay: number;
  restDay: number | null;
  targetDays: 90 | 120;
  theme: 'dark' | 'light' | 'system';
  onboarded?: boolean;
  goal?: string;
  experience?: Partial<Record<SkillArea, ExperienceLevel>>;
  /** Badge tiers already celebrated, as "badgeId:tier". */
  seenBadges?: string[];
  seenLevel?: number;
  replanDismissedUntil?: ISODate;
}

export type Energy = 1 | 2 | 3;

export interface Checkin {
  date: ISODate;
  energy: Energy;
}

export interface QuestDone {
  key: string;
  date: ISODate;
  questId: string;
}

export interface BossResult {
  phaseId: string;
  best: number;
  passedAt?: ISODate;
}

export interface ModuleProgress {
  moduleId: string;
  status: ModuleStatus;
  selectedCourseIds: string[];
  quizScore?: number;
  confidence?: number;
  notes: string;
  startedAt?: string;
  completedAt?: string;
  /** Whether the pre-learning prediction was right. */
  predicted?: boolean;
  explanation?: string;
  /** Key-idea card indexes the learner says their explanation covered. */
  explainCovered?: number[];
  explainedAt?: ISODate;
  buildDone?: number[];
  buildAt?: ISODate;
  proofUrl?: string;
}

export interface CourseProgress {
  courseId: string;
  lessonsDone: number[];
}

export interface DailyLog {
  id?: number;
  date: ISODate;
  minutes: number;
  moduleId?: string;
  mood?: number;
  note?: string;
  createdAt: string;
}

export interface MilestoneState {
  id: string;
  status: MilestoneStatus;
  updatedAt: string;
}

export interface CareerState {
  id: string;
  done: boolean;
}

export interface Application {
  id?: number;
  company: string;
  role: string;
  url?: string;
  status: ApplicationStatus;
  date: ISODate;
  notes?: string;
}

export interface Watched {
  id: string;
  watchedAt: string;
}

export interface QuizAttempt {
  id?: number;
  moduleId: string;
  at: string;
  score: number;
  /** Keys of questions answered wrongly. */
  wrong: string[];
}

/** Leitner spaced-repetition state for one recall item. */
export interface ReviewCard {
  id: string;
  box: number;
  due: ISODate;
  reviews: number;
  lapses: number;
  lastReviewed?: ISODate;
}

export const DEFAULT_SETTINGS: Settings = {
  key: 'app',
  name: 'Future AI Engineer',
  startDate: '2026-09-28',
  minutesPerDay: 90,
  restDay: 0,
  targetDays: 90,
  theme: 'dark',
};

export class JourneyDB extends Dexie {
  settings!: EntityTable<Settings, 'key'>;
  moduleProgress!: EntityTable<ModuleProgress, 'moduleId'>;
  courseProgress!: EntityTable<CourseProgress, 'courseId'>;
  logs!: EntityTable<DailyLog, 'id'>;
  milestones!: EntityTable<MilestoneState, 'id'>;
  career!: EntityTable<CareerState, 'id'>;
  applications!: EntityTable<Application, 'id'>;
  watched!: EntityTable<Watched, 'id'>;
  quizAttempts!: EntityTable<QuizAttempt, 'id'>;
  reviewCards!: EntityTable<ReviewCard, 'id'>;
  checkins!: EntityTable<Checkin, 'date'>;
  questLog!: EntityTable<QuestDone, 'key'>;
  bosses!: EntityTable<BossResult, 'phaseId'>;

  constructor(name = 'ai-engineer-journey') {
    super(name);
    const v1 = {
      settings: 'key',
      moduleProgress: 'moduleId, status',
      courseProgress: 'courseId',
      logs: '++id, date, moduleId',
      milestones: 'id',
      career: 'id',
      applications: '++id, status',
      watched: 'id',
    };
    this.version(1).stores(v1);
    const v2 = { ...v1, quizAttempts: '++id, moduleId', reviewCards: 'id, due' };
    this.version(2).stores(v2);
    const v3 = { ...v2, checkins: 'date' };
    this.version(3).stores(v3);
    this.version(4).stores({ ...v3, questLog: 'key, date', bosses: 'phaseId' });
  }
}

export const db = new JourneyDB();

export const TABLES = [
  'settings',
  'moduleProgress',
  'courseProgress',
  'logs',
  'milestones',
  'career',
  'applications',
  'watched',
  'quizAttempts',
  'reviewCards',
  'checkins',
  'questLog',
  'bosses',
] as const;
