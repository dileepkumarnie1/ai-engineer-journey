import { Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Icon } from '@/components/ui';
import { flashcards, getPhase } from '@/content';
import type { Journey } from '@/hooks/useJourney';
import { cn } from '@/lib/cn';
import { hues } from '@/lib/colors';
import { diffDays, formatShort } from '@/lib/dates';
import { BADGES, weekStrip, type BadgeInput } from '@/lib/gamification';
import { cardHover, rise } from './motion';

export function UpNext({ j }: { j: Journey }) {
  return (
    <motion.section variants={rise} className="glass flex flex-col p-6">
      <h2 className="mb-4 text-lg font-bold">🧭 Up next</h2>
      <ol className="relative flex-1 space-y-1 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-0.5 before:bg-gradient-to-b before:from-violet-500 before:to-transparent">
        {j.nextModules.map(({ module, plan }, i) => {
          const ph = getPhase(plan.phaseId)!;
          const isToday = j.todayPlan?.moduleId === module.id;
          return (
            <motion.li key={module.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
              <Link to={`/module/${module.id}`} className="group relative flex items-center gap-3 rounded-2xl p-2 transition hover:bg-slate-100 dark:hover:bg-white/5">
                <span className={cn('relative z-10 grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md transition group-hover:scale-110', hues[ph.hue].gradient)}>
                  <Icon name={module.icon} className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{module.title}</p>
                  <p className="text-xs text-slate-500">
                    {formatShort(plan.startDate)} → {formatShort(plan.endDate)} · {module.studyDays}d
                  </p>
                </div>
                {isToday && <span className="rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-bold text-white">TODAY</span>}
              </Link>
            </motion.li>
          );
        })}
      </ol>
    </motion.section>
  );
}

export function WeekBars({ j }: { j: Journey }) {
  const days = weekStrip(j.today, j.schedule, j.minutes).map((d, i) => ({
    iso: d.date,
    label: 'MTWTFSS'[i]!,
    min: d.minutes,
    isToday: d.date === j.today,
    future: diffDays(d.date, j.today) < 0,
  }));
  const target = j.settings.minutesPerDay;
  const max = Math.max(target * 1.25, ...days.map((d) => d.min));
  const weekTotal = days.reduce((s, d) => s + d.min, 0);

  return (
    <motion.section variants={rise} className="glass p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-bold">📊 This week</h2>
        <p className="text-sm text-slate-500">
          <span className="font-bold text-slate-900 dark:text-white">{(weekTotal / 60).toFixed(1)} h</span> / {(j.weekGoal / 60).toFixed(1)} h
        </p>
      </div>
      <div className="relative flex h-40 items-end gap-3">
        <div className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-amber-400/70" style={{ bottom: `${(target / max) * 100}%` }}>
          <span className="absolute -top-5 right-0 text-[10px] font-semibold text-amber-500">target {target}m</span>
        </div>
        {days.map((d, i) => (
          <div key={d.iso} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div className="relative flex w-full flex-1 items-end">
              <motion.div
                className={cn(
                  'w-full rounded-t-xl',
                  d.min >= target ? 'bg-gradient-to-t from-emerald-500 to-lime-400' : d.min > 0 ? 'bg-gradient-to-t from-violet-600 to-cyan-400' : 'bg-slate-200 dark:bg-white/10',
                )}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(4, (d.min / max) * 100)}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 14, delay: 0.3 + i * 0.06 }}
                title={`${d.min} min`}
              />
            </div>
            <span className={cn('grid size-6 place-items-center rounded-full text-[11px] font-bold', d.isToday ? 'bg-violet-500 text-white' : d.future ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500')}>
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

export function Achievements({ input }: { input: BadgeInput }) {
  const earned = BADGES.filter((b) => b.earned(input)).length;
  return (
    <motion.section variants={rise} className="glass p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-bold">🏅 Achievements</h2>
        <p className="text-sm text-slate-500"><span className="font-bold text-slate-900 dark:text-white">{earned}</span> / {BADGES.length} unlocked</p>
      </div>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
        {BADGES.map((b, i) => {
          const got = b.earned(input);
          return (
            <motion.div
              key={b.id}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.3 + i * 0.05 }}
              whileHover={{ scale: 1.12, rotate: got ? 6 : 0 }}
              className="flex flex-col items-center gap-1 text-center"
              title={`${b.title} — ${b.hint}`}
            >
              <div
                className={cn(
                  'relative grid size-14 place-items-center rounded-2xl text-2xl',
                  got ? 'bg-gradient-to-br from-amber-300 via-orange-400 to-pink-500 shadow-lg shadow-orange-500/30' : 'bg-slate-200 grayscale dark:bg-white/5',
                )}
              >
                <span className={cn(!got && 'opacity-30')}>{b.emoji}</span>
                {!got && <Lock className="absolute -bottom-1 -right-1 size-4 rounded-full bg-white p-0.5 text-slate-400 dark:bg-slate-800" aria-hidden />}
              </div>
              <span className={cn('line-clamp-1 text-[10px] font-semibold', got ? '' : 'text-slate-400')}>{b.title}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

export function ConceptCard({ dayIndex }: { dayIndex: number }) {
  const [flipped, setFlipped] = useState(false);
  const card = flashcards[((dayIndex % flashcards.length) + flashcards.length) % flashcards.length]!;
  return (
    <motion.section variants={rise} whileHover={cardHover} className="h-full">
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-pressed={flipped}
        className="h-full min-h-56 w-full text-left [perspective:1200px]"
        aria-label="Concept of the day. Tap to flip."
      >
        <motion.div
          className="relative size-full min-h-56 [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        >
          <div className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-fuchsia-600 via-violet-600 to-indigo-700 p-6 text-white shadow-xl [backface-visibility:hidden]">
            <div className="animate-blob absolute -right-10 -top-10 size-40 rounded-full bg-pink-400/40 blur-2xl" />
            <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-white/80">💡 Concept of the day</p>
            <p className="relative text-xl font-bold leading-snug">{card.q}</p>
            <p className="relative text-xs text-white/70">Think first, then tap to reveal ↻</p>
          </div>
          <div className="absolute inset-0 flex flex-col justify-center gap-3 rounded-[1.25rem] bg-white p-6 shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)] dark:bg-slate-800">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-500">Answer</p>
            <p className="text-sm leading-relaxed">{card.a}</p>
          </div>
        </motion.div>
      </button>
    </motion.section>
  );
}
