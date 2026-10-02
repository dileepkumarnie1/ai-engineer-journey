import type { Energy } from '@/db/db';

export interface QuestContext {
  todayMinutes: number;
  reviewsToday: number;
  quizScoresToday: number[];
  reflected: boolean;
  energy?: Energy;
  explainedToday: boolean;
  buildTickedToday: boolean;
  hasCards: boolean;
}

export interface Quest {
  id: string;
  emoji: string;
  title: string;
  /** 0–1 progress; 1 = complete. */
  progress: (c: QuestContext) => number;
  eligible?: (c: QuestContext) => boolean;
}

const done = (v: boolean) => (v ? 1 : 0);

// One quest from each group per day: a warm-up, a core habit and a stretch goal.
export const QUEST_GROUPS: Quest[][] = [
  [
    { id: 'checkin', emoji: '🔋', title: 'Check in your energy', progress: (c) => done(c.energy !== undefined) },
    { id: 'reflect', emoji: '🪞', title: 'Log a one-line reflection', progress: (c) => done(c.reflected) },
  ],
  [
    { id: 'focus-25', emoji: '⏱️', title: 'Focus for 25 minutes', progress: (c) => Math.min(1, c.todayMinutes / 25) },
    { id: 'quiz', emoji: '🧠', title: 'Take a mastery check', progress: (c) => done(c.quizScoresToday.length > 0) },
    { id: 'recall-5', emoji: '🗂️', title: 'Review 5 recall cards', progress: (c) => Math.min(1, c.reviewsToday / 5), eligible: (c) => c.hasCards },
  ],
  [
    { id: 'explain', emoji: '🗣️', title: 'Explain a concept back in your own words', progress: (c) => done(c.explainedToday) },
    { id: 'build-check', emoji: '🛠️', title: 'Tick off a build acceptance check', progress: (c) => done(c.buildTickedToday) },
    { id: 'perfect', emoji: '🎯', title: 'Score 100% on a mastery check', progress: (c) => done(c.quizScoresToday.includes(100)) },
    { id: 'focus-60', emoji: '🔥', title: 'Focus for 60 minutes', progress: (c) => Math.min(1, c.todayMinutes / 60) },
  ],
];

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** Same three quests all day; a fresh set tomorrow. */
export const dailyQuests = (date: string, c: QuestContext): Quest[] =>
  QUEST_GROUPS.map((group, g) => {
    const pool = group.filter((q) => q.eligible?.(c) ?? true);
    return pool[hash(`${date}#${g}`) % pool.length]!;
  });

export const questStatus = (date: string, c: QuestContext) =>
  dailyQuests(date, c).map((q) => ({ quest: q, progress: q.progress(c), done: q.progress(c) >= 1 }));
