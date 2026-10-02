import { z } from 'zod';
import { isIconName, type IconName } from '@/lib/icons';
import type { Hue } from '@/lib/colors';

const id = z.string().regex(/^[a-z0-9-]+$/, 'kebab-case id');
const rating = z.number().int().min(0).max(5);
const icon = z.string().refine(isIconName, 'unknown icon') as unknown as z.ZodType<IconName>;
const httpUrl = z.url({ protocol: /^https?$/ });

import { courseFormats } from './formats';

export { courseFormats, type CourseFormat } from './formats';

export const courseSchema = z.object({
  id,
  title: z.string().min(3).max(90),
  provider: z.string().min(2).max(40),
  url: httpUrl,
  format: z.enum(courseFormats),
  hours: z.number().positive().max(60),
  interactivity: rating,
  visual: rating,
  handsOn: rating,
  popularity: rating,
  certificate: z.boolean().optional(),
  paid: z.boolean().optional(),
  youtubeId: z
    .string()
    .regex(/^[\w-]{11}$/)
    .optional(),
  pitch: z.string().min(5).max(110),
  lessons: z.array(z.string().min(2).max(80)).min(1).optional(),
});
export type Course = z.infer<typeof courseSchema>;

export const moduleSchema = z.object({
  id,
  title: z.string().min(3).max(60),
  kind: z.enum(['learn', 'project']),
  icon,
  studyDays: z.number().int().min(1).max(10),
  tagline: z.string().max(100),
  flow: z.array(z.string().max(28)).min(3).max(7),
  cards: z
    .array(z.object({ icon, title: z.string().max(32), text: z.string().max(110) }))
    .length(3),
  bridge: z.string().max(140),
  build: z.string().max(170),
  /** "Explain it back" prompt: forces recall in your own words. */
  explain: z.string().min(20).max(140),
  /** Acceptance criteria for the build task. */
  checks: z.array(z.string().min(5).max(100)).min(2).max(4),
  tip: z.string().max(140).optional(),
  courses: z.array(courseSchema).min(1),
  quiz: z
    .array(
      z.object({
        q: z.string().max(120),
        options: z.array(z.string().max(90)).min(2).max(4),
        answer: z.number().int().min(0).max(3),
        why: z.string().min(10).max(220),
      }),
    )
    .min(2),
});
export type LearningModule = z.infer<typeof moduleSchema>;
export type QuizQuestion = LearningModule['quiz'][number];

export const phaseSchema = z.object({
  id,
  order: z.number().int().min(0),
  title: z.string().max(40),
  icon,
  hue: z.string() as unknown as z.ZodType<Hue>,
  goal: z.string().max(100),
  buffer: z.boolean().optional(),
  modules: z.array(moduleSchema).min(1),
});
export type Phase = z.infer<typeof phaseSchema>;

export interface Milestone {
  id: string;
  title: string;
  phaseId: string;
}

export interface Project {
  id: string;
  title: string;
  icon: IconName;
  summary: string;
  stack: string[];
  milestones: Milestone[];
}

export interface CareerItem {
  id: string;
  group: string;
  title: string;
}

export interface Flashcard {
  q: string;
  a: string;
}

export interface ResumeRewrite {
  before: string;
  after: string;
}
