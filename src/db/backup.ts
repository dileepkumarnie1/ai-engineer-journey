import { z } from 'zod';
import { isISODate } from '@/lib/dates';
import { db, TABLES } from './db';

const isoDate = z.string().refine(isISODate, 'YYYY-MM-DD');
const isoDateTime = z.string().max(40);
const text = (max: number) => z.string().max(max);

const settingsSchema = z.object({
  key: z.literal('app'),
  name: text(60),
  startDate: isoDate,
  minutesPerDay: z.number().int().min(15).max(480),
  restDay: z.number().int().min(0).max(6).nullable(),
  targetDays: z.union([z.literal(90), z.literal(120)]),
  theme: z.enum(['dark', 'light', 'system']),
});

const backupSchema = z.object({
  app: z.literal('ai-engineer-journey'),
  version: z.literal(1),
  exportedAt: isoDateTime,
  data: z.object({
    settings: z.array(settingsSchema).max(1),
    moduleProgress: z.array(
      z.object({
        moduleId: text(60),
        status: z.enum(['not-started', 'in-progress', 'done']),
        selectedCourseIds: z.array(text(80)).max(50),
        quizScore: z.number().min(0).max(100).optional(),
        confidence: z.number().int().min(1).max(5).optional(),
        notes: text(5000),
        startedAt: isoDateTime.optional(),
        completedAt: isoDateTime.optional(),
      }),
    ),
    courseProgress: z.array(
      z.object({ courseId: text(80), lessonsDone: z.array(z.number().int().min(0).max(100)).max(100) }),
    ),
    logs: z.array(
      z.object({
        id: z.number().int().positive().optional(),
        date: isoDate,
        minutes: z.number().int().min(1).max(600),
        moduleId: text(60).optional(),
        mood: z.number().int().min(1).max(5).optional(),
        note: text(280).optional(),
        createdAt: isoDateTime,
      }),
    ),
    milestones: z.array(
      z.object({ id: text(60), status: z.enum(['todo', 'doing', 'done']), updatedAt: isoDateTime }),
    ),
    career: z.array(z.object({ id: text(60), done: z.boolean() })),
    applications: z.array(
      z.object({
        id: z.number().int().positive().optional(),
        company: text(100),
        role: text(100),
        url: z.url({ protocol: /^https?$/ }).max(500).optional(),
        status: z.enum(['wishlist', 'applied', 'interview', 'offer', 'rejected']),
        date: isoDate,
        notes: text(1000).optional(),
      }),
    ),
    watched: z.array(z.object({ id: text(80), watchedAt: isoDateTime })),
  }),
});

export type Backup = z.infer<typeof backupSchema>;

export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

export const exportBackup = async (): Promise<Backup> => {
  const entries = await Promise.all(TABLES.map(async (t) => [t, await db.table(t).toArray()] as const));
  return {
    app: 'ai-engineer-journey',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: Object.fromEntries(entries) as Backup['data'],
  };
};

export const parseBackup = (raw: string): { ok: true; backup: Backup } | { ok: false; error: string } => {
  if (raw.length > MAX_BACKUP_BYTES) return { ok: false, error: 'File is larger than 5 MB.' };
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Not valid JSON.' };
  }
  const result = backupSchema.safeParse(json);
  if (!result.success) {
    const issue = result.error.issues[0];
    return { ok: false, error: `Invalid backup at "${issue?.path.join('.') ?? '?'}": ${issue?.message ?? ''}` };
  }
  return { ok: true, backup: result.data };
};

/** Replaces all local data with the backup contents. */
export const restoreBackup = async (backup: Backup) => {
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const t of TABLES) {
      await db.table(t).clear();
      await db.table(t).bulkPut(backup.data[t]);
    }
  });
};

export const resetAll = async () => {
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const t of TABLES) await db.table(t).clear();
  });
};

export const downloadBackup = async () => {
  const backup = await exportBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-journey-backup-${backup.exportedAt.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
