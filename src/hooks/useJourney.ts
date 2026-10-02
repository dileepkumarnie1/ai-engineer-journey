import { useMemo } from 'react';
import { allModules, careerChecklist, corePhases, getModule, getPhaseOfModule, phases, projects } from '@/content';
import {
  useAllQuizAttempts,
  useBosses,
  useCareerSet,
  useCheckins,
  useCourseProgressMap,
  useLogs,
  useMilestoneMap,
  useModuleProgressMap,
  useQuestLog,
  useReviewCards,
  useSettings,
} from '@/db/hooks';
import { questContext, summarize } from '@/lib/achievements';
import { todayISO } from '@/lib/dates';
import { weekStrip } from '@/lib/gamification';
import { readinessScore, studyDaysDone, totalStudyDays } from '@/lib/progress';
import { questStatus } from '@/lib/quests';
import {
  buildPlan,
  calendarDay,
  planForDate,
  plannedDoneBy,
  projectFinish,
  stretchFor,
  toContentIndex,
  type ScheduleSettings,
} from '@/lib/schedule';
import { skillScores } from '@/lib/skills';
import { nextDueDate, recallQueue, weakSpots } from '@/lib/srs';
import { lowSignals, shouldOfferReplan } from '@/lib/wellbeing';

/** Single source of derived journey stats for the whole app. */
export const useJourney = () => {
  const settings = useSettings();
  const mp = useModuleProgressMap();
  const cp = useCourseProgressMap();
  const logs = useLogs();
  const milestones = useMilestoneMap();
  const career = useCareerSet();
  const cards = useReviewCards();
  const checkins = useCheckins();
  const questLog = useQuestLog();
  const bossRows = useBosses();
  const attempts = useAllQuizAttempts();

  return useMemo(() => {
    const today = todayISO();
    const stretch = stretchFor(settings.targetDays);
    const s: ScheduleSettings = { startDate: settings.startDate, restDay: settings.restDay, stretch };
    const plan = buildPlan(phases, s);
    const coreTotal = totalStudyDays(corePhases);
    const coreDone = studyDaysDone(corePhases, mp, cp);
    const elapsed = plannedDoneBy(today, s);
    const plannedDone = Math.min(coreTotal, toContentIndex(elapsed, coreTotal, stretch));
    const todayPlan = planForDate(plan, today, s);
    const bosses = new Map(bossRows.map((b) => [b.phaseId, b]));
    const sum = summarize({
      schedule: s,
      today,
      logs,
      mp,
      cp,
      milestones,
      careerDone: career.size,
      cards,
      questsDone: questLog.length,
      bossesPassed: bossRows.filter((b) => b.passedAt).length,
    });
    const { minutes, streak, badgeInput } = sum;
    const allMilestones = projects.flatMap((p) => p.milestones);
    const learning = coreDone / coreTotal;
    const projectsFrac = allMilestones.length ? badgeInput.milestonesDone / allMilestones.length : 0;
    const careerFrac = career.size / careerChecklist.length;
    const nextModules = plan
      .filter((p) => mp.get(p.moduleId)?.status !== 'done')
      .slice(0, 4)
      .map((p) => ({ plan: p, module: getModule(p.moduleId)! }));
    const progressRows = [...mp.values()];
    const todayLogs = logs.filter((l) => l.date === today);
    // Interview flashcards join recall once the learner reaches the LLM phase.
    const flashUnlocked = progressRows.some((r) => r.quizScore !== undefined && (getPhaseOfModule(r.moduleId)?.order ?? 0) >= 3);
    const week = weekStrip(today, s, minutes, new Set(streak.frozen));
    const weekGoal = week.filter((d) => d.status !== 'rest' && d.status !== 'na').length * settings.minutesPerDay;
    const pace = coreDone - plannedDone;
    const low = lowSignals(checkins, logs, today);

    return {
      settings,
      today,
      schedule: s,
      plan,
      day: calendarDay(today, s),
      coreEndDay: calendarDay(plan.filter((p) => !p.buffer).at(-1)!.endDate, s),
      finishDay: calendarDay(plan.at(-1)!.endDate, s),
      coreTotal,
      coreDone,
      plannedDone,
      pace,
      projected: projectFinish(today, s, coreDone, coreTotal),
      todayPlan,
      todayModule: todayPlan ? getModule(todayPlan.moduleId) : undefined,
      nextModules,
      minutes,
      totalMinutes: sum.totalMinutes,
      plannedMinutes: Math.min(elapsed, coreTotal * stretch) * settings.minutesPerDay,
      streak: streak.current,
      bestStreak: streak.best,
      freezes: streak.freezes,
      frozen: streak.frozen,
      week,
      weekGoal,
      weekMinutes: week.reduce((total, d) => total + d.minutes, 0),
      cards,
      reviews: sum.reviews,
      recall: recallQueue(cards, today, flashUnlocked),
      nextReview: nextDueDate(cards, today),
      weakSpots: weakSpots(allModules, mp, cards),
      skills: skillScores(mp, cp),
      todayEnergy: checkins.find((c) => c.date === today)?.energy,
      lowSignals: low,
      offerReplan: shouldOfferReplan({ pace, targetDays: settings.targetDays, lowSignals: low, today, dismissedUntil: settings.replanDismissedUntil }),
      xp: sum.xp,
      badgeInput,
      quests: questStatus(today, questContext({ today, logs, cards, attempts, checkins, mp })),
      bosses,
      bossUnlocked: (phaseId: string) => Boolean(phases.find((p) => p.id === phaseId)?.modules.every((m) => mp.get(m.id)?.status === 'done')),
      learning,
      projectsFrac,
      careerFrac,
      readiness: readinessScore(learning, projectsFrac, careerFrac),
      modulesDone: badgeInput.modulesDone,
      lessonsDone: sum.lessons,
      milestonesDone: badgeInput.milestonesDone,
      careerDone: career.size,
      todayMinutes: minutes.get(today) ?? 0,
      todayReflected: todayLogs.some((l) => l.note || l.mood),
      mp,
      cp,
      logs,
    };
  }, [settings, mp, cp, logs, milestones, career, cards, checkins, questLog, bossRows, attempts]);
};

export type Journey = ReturnType<typeof useJourney>;
