import { useMemo } from 'react';
import { allModules, careerChecklist, corePhases, getModule, getPhaseOfModule, phases, projects } from '@/content';
import {
  useCareerSet,
  useCourseProgressMap,
  useLogs,
  useMilestoneMap,
  useModuleProgressMap,
  useReviewCards,
  useSettings,
} from '@/db/hooks';
import { todayISO } from '@/lib/dates';
import {
  minutesByDate,
  readinessScore,
  streakInfo,
  studyDaysDone,
  totalStudyDays,
} from '@/lib/progress';
import { buildPlan, calendarDay, planForDate, plannedDoneBy, projectFinish } from '@/lib/schedule';
import { nextDueDate, recallQueue, weakSpots } from '@/lib/srs';
import { weekStrip } from '@/lib/gamification';

/** Single source of derived journey stats for the whole app. */
export const useJourney = () => {
  const settings = useSettings();
  const mp = useModuleProgressMap();
  const cp = useCourseProgressMap();
  const logs = useLogs();
  const milestones = useMilestoneMap();
  const career = useCareerSet();
  const cards = useReviewCards();

  return useMemo(() => {
    const today = todayISO();
    const s = { startDate: settings.startDate, restDay: settings.restDay };
    const plan = buildPlan(phases, s);
    const coreTotal = totalStudyDays(corePhases);
    const coreDone = studyDaysDone(corePhases, mp, cp);
    const plannedDone = Math.min(coreTotal, plannedDoneBy(today, s));
    const todayPlan = planForDate(plan, today, s);
    const minutes = minutesByDate(logs);
    const totalMinutes = logs.reduce((sum, l) => sum + l.minutes, 0);
    const allMilestones = projects.flatMap((p) => p.milestones);
    const milestonesDone = allMilestones.filter((m) => milestones.get(m.id) === 'done').length;
    const learning = coreDone / coreTotal;
    const projectsFrac = allMilestones.length ? milestonesDone / allMilestones.length : 0;
    const careerFrac = career.size / careerChecklist.length;
    const nextModules = plan
      .filter((p) => mp.get(p.moduleId)?.status !== 'done')
      .slice(0, 4)
      .map((p) => ({ plan: p, module: getModule(p.moduleId)! }));
    const progressRows = [...mp.values()];
    const capstone = projects.find((p) => p.id === 'capstone');
    const todayLogs = logs.filter((l) => l.date === today);
    const streak = streakInfo(minutes, today, s);
    // Interview flashcards join recall once the learner reaches the LLM phase.
    const flashUnlocked = progressRows.some((r) => r.quizScore !== undefined && (getPhaseOfModule(r.moduleId)?.order ?? 0) >= 3);
    const week = weekStrip(today, s, minutes, new Set(streak.frozen));
    const weekGoal = week.filter((d) => d.status !== 'rest' && d.status !== 'na').length * settings.minutesPerDay;

    return {
      settings,
      today,
      schedule: s,
      plan,
      day: calendarDay(today, s),
      coreTotal,
      coreDone,
      plannedDone,
      pace: coreDone - plannedDone,
      projected: projectFinish(today, s, coreDone, coreTotal),
      todayPlan,
      todayModule: todayPlan ? getModule(todayPlan.moduleId) : undefined,
      nextModules,
      minutes,
      totalMinutes,
      plannedMinutes: plannedDone * settings.minutesPerDay,
      streak: streak.current,
      bestStreak: streak.best,
      freezes: streak.freezes,
      frozen: streak.frozen,
      week,
      weekGoal,
      weekMinutes: week.reduce((sum, d) => sum + d.minutes, 0),
      cards,
      reviews: cards.reduce((sum, c) => sum + c.reviews, 0),
      recall: recallQueue(cards, today, flashUnlocked),
      nextReview: nextDueDate(cards, today),
      weakSpots: weakSpots(allModules, mp, cards),
      learning,
      projectsFrac,
      careerFrac,
      readiness: readinessScore(learning, projectsFrac, careerFrac),
      modulesDone: progressRows.filter((r) => r.status === 'done').length,
      lessonsDone: [...cp.values()].reduce((sum, r) => sum + r.lessonsDone.length, 0),
      milestonesDone,
      careerDone: career.size,
      quizAce: progressRows.some((r) => r.quizScore === 100),
      phasesDone: phases.filter((p) => p.modules.every((m) => mp.get(m.id)?.status === 'done')).length,
      capstoneDone: Boolean(capstone?.milestones.every((m) => milestones.get(m.id) === 'done')),
      todayMinutes: minutes.get(today) ?? 0,
      todayReflected: todayLogs.some((l) => l.note || l.mood),
      mp,
      cp,
      logs,
    };
  }, [settings, mp, cp, logs, milestones, career, cards]);
};

export type Journey = ReturnType<typeof useJourney>;
