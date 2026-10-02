import { addDays, diffDays, weekday, type ISODate } from './dates';
import { isStudyDay, type ScheduleSettings } from './schedule';

export const XP_RULES = { minute: 1, lesson: 10, module: 150, milestone: 100, career: 25, review: 5 } as const;

export interface XpInput {
  minutes: number;
  lessons: number;
  modulesDone: number;
  milestonesDone: number;
  careerDone: number;
  reviews: number;
}

export const computeXp = (i: XpInput): number =>
  i.minutes * XP_RULES.minute +
  i.lessons * XP_RULES.lesson +
  i.modulesDone * XP_RULES.module +
  i.milestonesDone * XP_RULES.milestone +
  i.careerDone * XP_RULES.career +
  i.reviews * XP_RULES.review;

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
  perfectQuizzes: number;
  milestonesDone: number;
  capstoneDone: boolean;
  reviews: number;
  freezesUsed: number;
}

export interface Badge {
  id: string;
  emoji: string;
  title: string;
  /** What reaching `n` means, e.g. "7-day streak". */
  goal: (n: number) => string;
  metric: (b: BadgeInput) => number;
  /** One threshold = single badge; three = bronze / silver / gold. */
  tiers: number[];
}

export const TIER_NAMES = ['Bronze', 'Silver', 'Gold'] as const;

export const BADGES: Badge[] = [
  { id: 'first-session', emoji: '🚀', title: 'Lift-off', goal: () => 'Log your first session', metric: (b) => b.logsCount, tiers: [1] },
  { id: 'streak', emoji: '🔥', title: 'On fire', goal: (n) => `${n}-day streak`, metric: (b) => b.bestStreak, tiers: [3, 7, 21] },
  { id: 'hours', emoji: '⏱️', title: 'Deep worker', goal: (n) => `${n} hours studied`, metric: (b) => b.totalMinutes / 60, tiers: [10, 25, 50] },
  { id: 'modules', emoji: '🧩', title: 'Module master', goal: (n) => `${n} module${n === 1 ? '' : 's'} mastered`, metric: (b) => b.modulesDone, tiers: [1, 12, 30] },
  { id: 'quiz-ace', emoji: '🎯', title: 'Quiz ace', goal: (n) => `${n} perfect quiz${n === 1 ? '' : 'zes'}`, metric: (b) => b.perfectQuizzes, tiers: [1, 5, 15] },
  { id: 'phase', emoji: '🏅', title: 'Phase cleared', goal: (n) => `${n} phase${n === 1 ? '' : 's'} cleared`, metric: (b) => b.phasesDone, tiers: [1, 5, 9] },
  { id: 'builder', emoji: '🛠️', title: 'Builder', goal: (n) => `${n} project milestone${n === 1 ? '' : 's'} shipped`, metric: (b) => b.milestonesDone, tiers: [1, 10, 25] },
  { id: 'recall', emoji: '🗂️', title: 'Memory palace', goal: (n) => `${n} recall reviews`, metric: (b) => b.reviews, tiers: [50, 200, 500] },
  { id: 'freeze-saved', emoji: '❄️', title: 'Saved by ice', goal: () => 'A streak freeze rescues your streak', metric: (b) => b.freezesUsed, tiers: [1] },
  { id: 'capstone', emoji: '🏆', title: 'Capstone hero', goal: () => 'Finish DataSentinel AI', metric: (b) => (b.capstoneDone ? 1 : 0), tiers: [1] },
];

export const badgeTier = (badge: Badge, input: BadgeInput) => badge.tiers.filter((t) => badge.metric(input) >= t).length;

export const tierName = (badge: Badge, tier: number) => (badge.tiers.length > 1 && tier > 0 ? TIER_NAMES[tier - 1] : undefined);

/** Every earned badge tier as "badgeId:tier", so a new tier can be celebrated on its own. */
export const earnedBadgeKeys = (input: BadgeInput) =>
  BADGES.flatMap((b) => Array.from({ length: badgeTier(b, input) }, (_, i) => `${b.id}:${i + 1}`));

export type DayStatus = 'done' | 'missed' | 'frozen' | 'today' | 'rest' | 'future' | 'na';

/** Monday-to-Sunday strip for the week containing `today`. */
export const weekStrip = (
  today: ISODate,
  s: ScheduleSettings,
  minutes: Map<ISODate, number>,
  frozen: ReadonlySet<ISODate> = new Set(),
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
    else if (frozen.has(date)) status = 'frozen';
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
