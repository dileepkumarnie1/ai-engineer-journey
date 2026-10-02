import { getModule, phases, projects } from '@/content';
import type { Checkin, CourseProgress, DailyLog, MilestoneStatus, ModuleProgress, QuizAttempt, ReviewCard } from '@/db/db';
import { toISO, type ISODate } from './dates';
import { computeXp, type BadgeInput } from './gamification';
import { minutesByDate, streakInfo } from './progress';
import type { QuestContext } from './quests';
import type { ScheduleSettings } from './schedule';

export const MIN_EXPLANATION = 40;

export interface AchievementSource {
  schedule: ScheduleSettings;
  today: ISODate;
  logs: DailyLog[];
  mp: Map<string, ModuleProgress>;
  cp: Map<string, CourseProgress>;
  milestones: Map<string, MilestoneStatus>;
  careerDone: number;
  cards: ReviewCard[];
  questsDone: number;
  bossesPassed: number;
}

export const isExplained = (p?: ModuleProgress) => (p?.explanation?.trim().length ?? 0) >= MIN_EXPLANATION;

export const isBuildVerified = (p?: ModuleProgress) => {
  const checks = p && getModule(p.moduleId)?.checks.length;
  return Boolean(checks && (p.buildDone ?? []).filter((i) => i < checks).length >= checks);
};

/** XP, badge inputs and streak from raw data: shared by the dashboard and the celebration layer. */
export const summarize = (src: AchievementSource) => {
  const minutes = minutesByDate(src.logs);
  const streak = streakInfo(minutes, src.today, src.schedule);
  const rows = [...src.mp.values()];
  const totalMinutes = src.logs.reduce((sum, l) => sum + l.minutes, 0);
  const lessons = [...src.cp.values()].reduce((sum, r) => sum + r.lessonsDone.length, 0);
  const modulesDone = rows.filter((r) => r.status === 'done').length;
  const milestonesDone = projects.flatMap((p) => p.milestones).filter((m) => src.milestones.get(m.id) === 'done').length;
  const reviews = src.cards.reduce((sum, c) => sum + c.reviews, 0);
  const capstone = projects.find((p) => p.id === 'capstone');
  const badgeInput: BadgeInput = {
    logsCount: src.logs.length,
    totalMinutes,
    bestStreak: streak.best,
    modulesDone,
    phasesDone: phases.filter((p) => p.modules.every((m) => src.mp.get(m.id)?.status === 'done')).length,
    perfectQuizzes: rows.filter((r) => r.quizScore === 100).length,
    milestonesDone,
    capstoneDone: Boolean(capstone?.milestones.every((m) => src.milestones.get(m.id) === 'done')),
    reviews,
    freezesUsed: streak.frozen.length,
    questsDone: src.questsDone,
    bossesPassed: src.bossesPassed,
  };
  const xp = computeXp({
    minutes: totalMinutes,
    lessons,
    modulesDone,
    milestonesDone,
    careerDone: src.careerDone,
    reviews,
    quests: src.questsDone,
    bosses: src.bossesPassed,
    explained: rows.filter(isExplained).length,
    builds: rows.filter(isBuildVerified).length,
  });
  return { minutes, streak, totalMinutes, lessons, reviews, badgeInput, xp };
};

export const questContext = (o: {
  today: ISODate;
  logs: DailyLog[];
  cards: ReviewCard[];
  attempts: QuizAttempt[];
  checkins: Checkin[];
  mp: Map<string, ModuleProgress>;
}): QuestContext => {
  const todayLogs = o.logs.filter((l) => l.date === o.today);
  const rows = [...o.mp.values()];
  return {
    todayMinutes: todayLogs.reduce((sum, l) => sum + l.minutes, 0),
    reviewsToday: o.cards.filter((c) => c.lastReviewed === o.today).length,
    quizScoresToday: o.attempts.filter((a) => toISO(new Date(a.at)) === o.today).map((a) => a.score),
    reflected: todayLogs.some((l) => l.note || l.mood),
    energy: o.checkins.find((c) => c.date === o.today)?.energy,
    explainedToday: rows.some((r) => r.explainedAt === o.today && isExplained(r)),
    buildTickedToday: rows.some((r) => r.buildAt === o.today && (r.buildDone?.length ?? 0) > 0),
    hasCards: o.cards.length > 0,
  };
};
