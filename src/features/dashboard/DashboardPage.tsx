import { motion } from 'motion/react';
import { useMemo } from 'react';
import { Link, Navigate } from 'react-router';
import { Heatmap } from '@/components/Heatmap';
import { allModules } from '@/content';
import { useOnboarded } from '@/db/hooks';
import { DailyRecallCard, WeakSpotsCard } from '@/features/recall/RecallWidgets';
import { useJourney } from '@/hooks/useJourney';
import { computeXp, type BadgeInput } from '@/lib/gamification';
import { getResumeTarget } from '@/lib/resume';
import { HeroPanel } from './HeroPanel';
import { JourneyTimeline } from './JourneyTimeline';
import { rise, stagger } from './motion';
import { ResumeCard } from './ResumeCard';
import { StatTiles } from './StatTiles';
import { TodayMission } from './TodayMission';
import { Achievements, ConceptCard, UpNext, WeekBars } from './Widgets';

export default function DashboardPage() {
  const j = useJourney();
  const onboarded = useOnboarded();
  const xp = computeXp({
    minutes: j.totalMinutes,
    lessons: j.lessonsDone,
    modulesDone: j.modulesDone,
    milestonesDone: j.milestonesDone,
    careerDone: j.careerDone,
    reviews: j.reviews,
  });
  const badgeInput: BadgeInput = {
    logsCount: j.logs.length,
    totalMinutes: j.totalMinutes,
    bestStreak: j.bestStreak,
    modulesDone: j.modulesDone,
    phasesDone: j.phasesDone,
    quizAce: j.quizAce,
    milestonesDone: j.milestonesDone,
    capstoneDone: j.capstoneDone,
    reviews: j.reviews,
    freezesUsed: j.frozen.length,
  };
  const resume = useMemo(() => getResumeTarget(allModules, j.mp, j.cp, j.logs), [j.mp, j.cp, j.logs]);

  if (onboarded === false) return <Navigate to="/welcome" replace />;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <HeroPanel j={j} xp={xp} resume={resume} />

      <ResumeCard target={resume} />

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-8">
          <TodayMission j={j} />
        </div>
        <div className="min-w-0 xl:col-span-4">
          <UpNext j={j} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <motion.div variants={rise} className="min-w-0 lg:col-span-7">
          <DailyRecallCard j={j} />
        </motion.div>
        <motion.div variants={rise} className="min-w-0 lg:col-span-5">
          <WeakSpotsCard j={j} />
        </motion.div>
      </div>

      <StatTiles j={j} />

      <JourneyTimeline j={j} />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-5">
          <WeekBars j={j} />
        </div>
        <div className="min-w-0 lg:col-span-7">
          <Achievements input={badgeInput} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-4">
          <ConceptCard dayIndex={j.day - 1} />
        </div>
        <motion.section variants={rise} className="glass min-w-0 p-6 lg:col-span-8">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-bold">🗓 Activity</h2>
            <Link to="/tracker" className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-300">Log time →</Link>
          </div>
          <Heatmap
            start={j.settings.startDate}
            days={120}
            minutes={j.minutes}
            target={j.settings.minutesPerDay}
            today={j.today}
            restDay={j.settings.restDay}
          />
        </motion.section>
      </div>
    </motion.div>
  );
}
