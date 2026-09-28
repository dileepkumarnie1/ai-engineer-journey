import { addDays, diffDays, weekday, type ISODate } from './dates';
import { isStudyDay, type ScheduleSettings } from './schedule';

export const XP_RULES = { minute: 1, lesson: 10, module: 150, milestone: 100, career: 25 } as const;

export interface XpInput {
  minutes: number;
  lessons: number;
  modulesDone: number;
  milestonesDone: number;
  careerDone: number;
}

export const computeXp = (i: XpInput): number =>
  i.minutes * XP_RULES.minute +
  i.lessons * XP_RULES.lesson +
  i.modulesDone * XP_RULES.module +
  i.milestonesDone * XP_RULES.milestone +
  i.careerDone * XP_RULES.career;

export const LEVELS = [
  { min: 0, title: 'Data Tester', emoji: '🧪' },
  { min: 300, title: 'Python Wrangler', emoji: '🐍' },
  { min: 900, title: 'ML Explorer', emoji: '🔭' },
  { min: 1800, title: 'Prompt Crafter', emoji: '✨' },
  { min: 3200, title: 'RAG Builder', emoji: '📚' },
  { min: 5000, title: 'Agent Architect', emoji: '🤖' },
  { min: 7200, title: 'LLMOps Guardian', emoji: '🛡️' },
  { min: 10000, title: 'AI Engineer', emoji: '🏆' },
] as const;

export const levelFor = (xp: number) => {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i]!.min) idx = i;
  const current = LEVELS[idx]!;
  const next = LEVELS[idx + 1];
  const progress = next ? (xp - current.min) / (next.min - current.min) : 1;
  return { index: idx, level: idx + 1, current, next, progress };
};

export interface BadgeInput {
  logsCount: number;
  totalMinutes: number;
  bestStreak: number;
  modulesDone: number;
  phasesDone: number;
  quizAce: boolean;
  milestonesDone: number;
  capstoneDone: boolean;
}

export const BADGES: { id: string; emoji: string; title: string; hint: string; earned: (b: BadgeInput) => boolean }[] = [
  { id: 'first-session', emoji: '🚀', title: 'Lift-off', hint: 'Log your first session', earned: (b) => b.logsCount > 0 },
  { id: 'streak-3', emoji: '🔥', title: 'On fire', hint: '3-day streak', earned: (b) => b.bestStreak >= 3 },
  { id: 'streak-7', emoji: '⚡', title: 'Unstoppable', hint: '7-day streak', earned: (b) => b.bestStreak >= 7 },
  { id: 'hours-10', emoji: '⏱️', title: 'Deep worker', hint: '10 hours studied', earned: (b) => b.totalMinutes >= 600 },
  { id: 'first-module', emoji: '🧩', title: 'First piece', hint: 'Complete a module', earned: (b) => b.modulesDone >= 1 },
  { id: 'quiz-ace', emoji: '🎯', title: 'Quiz ace', hint: 'Score 100% on a quiz', earned: (b) => b.quizAce },
  { id: 'phase-done', emoji: '🏅', title: 'Phase cleared', hint: 'Finish a whole phase', earned: (b) => b.phasesDone >= 1 },
  { id: 'builder', emoji: '🛠️', title: 'Builder', hint: 'Ship a project milestone', earned: (b) => b.milestonesDone >= 1 },
  { id: 'hours-50', emoji: '🧠', title: 'Half-century', hint: '50 hours studied', earned: (b) => b.totalMinutes >= 3000 },
  { id: 'capstone', emoji: '🏆', title: 'Capstone hero', hint: 'Finish DataSentinel AI', earned: (b) => b.capstoneDone },
];

export type DayStatus = 'done' | 'missed' | 'today' | 'rest' | 'future' | 'na';

/** Monday-to-Sunday strip for the week containing `today`. */
export const weekStrip = (
  today: ISODate,
  s: ScheduleSettings,
  minutes: Map<ISODate, number>,
): { date: ISODate; status: DayStatus; minutes: number }[] => {
  const monday = addDays(today, -((weekday(today) + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const m = minutes.get(date) ?? 0;
    let status: DayStatus;
    if (m > 0) status = 'done';
    else if (diffDays(s.startDate, date) < 0) status = 'na';
    else if (!isStudyDay(date, s)) status = 'rest';
    else if (date === today) status = 'today';
    else if (diffDays(date, today) < 0) status = 'future';
    else status = 'missed';
    return { date, status, minutes: m };
  });
};

export const lastNDays = (minutes: Map<ISODate, number>, today: ISODate, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const date = addDays(today, i - n + 1);
    return { date, minutes: minutes.get(date) ?? 0 };
  });

export const greeting = (hour: number) =>
  hour < 5 ? 'Burning the midnight oil' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
