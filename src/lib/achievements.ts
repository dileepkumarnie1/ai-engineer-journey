import { phases, projects } from '@/content';
import type { CourseProgress, DailyLog, MilestoneStatus, ModuleProgress, ReviewCard } from '@/db/db';
import type { ISODate } from './dates';
import { computeXp, type BadgeInput } from './gamification';
import { minutesByDate, streakInfo } from './progress';
import type { ScheduleSettings } from './schedule';

export interface AchievementSource {
  schedule: ScheduleSettings;
  today: ISODate;
  logs: DailyLog[];
  mp: Map<string, ModuleProgress>;
  cp: Map<string, CourseProgress>;
  milestones: Map<string, MilestoneStatus>;
  careerDone: number;
  cards: ReviewCard[];
}

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
  };
  const xp = computeXp({ minutes: totalMinutes, lessons, modulesDone, milestonesDone, careerDone: src.careerDone, reviews });
  return { minutes, streak, totalMinutes, lessons, reviews, badgeInput, xp };
};
