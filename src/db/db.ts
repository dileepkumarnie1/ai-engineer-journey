import { Dexie, type EntityTable } from 'dexie';
import type { ISODate } from '@/lib/dates';

export type ModuleStatus = 'not-started' | 'in-progress' | 'done';
export type MilestoneStatus = 'todo' | 'doing' | 'done';
export type ApplicationStatus = 'wishlist' | 'applied' | 'interview' | 'offer' | 'rejected';

export interface Settings {
  key: 'app';
  name: string;
  startDate: ISODate;
  minutesPerDay: number;
  restDay: number | null;
  targetDays: 90 | 120;
  theme: 'dark' | 'light' | 'system';
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

  constructor(name = 'ai-engineer-journey') {
    super(name);
    this.version(1).stores({
      settings: 'key',
      moduleProgress: 'moduleId, status',
      courseProgress: 'courseId',
      logs: '++id, date, moduleId',
      milestones: 'id',
      career: 'id',
      applications: '++id, status',
      watched: 'id',
    });
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
] as const;
