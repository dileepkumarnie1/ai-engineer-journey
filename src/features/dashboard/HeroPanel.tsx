import { motion } from 'motion/react';
import { ActivityRings } from '@/components/ActivityRings';
import { CountUp } from '@/components/CountUp';
import type { Journey } from '@/hooks/useJourney';
import { diffDays, formatShort } from '@/lib/dates';
import { greeting, levelFor } from '@/lib/gamification';
import { rise } from './motion';

const RINGS = [
  { key: 'today', label: 'Today', from: '#fb923c', to: '#f43f5e' },
  { key: 'plan', label: 'Core plan', from: '#a78bfa', to: '#22d3ee' },
  { key: 'ready', label: 'Job ready', from: '#34d399', to: '#a3e635' },
] as const;

export function HeroPanel({ j, xp }: { j: Journey; xp: number }) {
  const { settings } = j;
  const lvl = levelFor(xp);
  const beforeStart = j.day < 1;
  const daysToLaunch = diffDays(j.today, settings.startDate);
  const coreEnd = j.plan.filter((p) => !p.buffer).at(-1)!.endDate;
  const daysLeft = Math.max(0, diffDays(j.today, coreEnd));
  const values = {
    today: j.todayMinutes / settings.minutesPerDay,
    plan: j.learning,
    ready: j.readiness / 100,
  };

  return (
    <motion.section
      variants={rise}
      className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-700 via-indigo-600 to-cyan-500 p-6 text-white shadow-2xl shadow-indigo-500/25 sm:p-8"
    >
      {/* Animated backdrop */}
      <div className="bg-grid absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]" />
      <div className="animate-blob absolute -left-16 -top-24 -z-10 size-80 rounded-full bg-fuchsia-500/40 blur-3xl" />
      <div className="animate-blob absolute -bottom-32 right-10 -z-10 size-96 rounded-full bg-cyan-400/40 blur-3xl [animation-delay:-6s]" />
      <div className="animate-blob absolute right-1/3 top-0 -z-10 size-64 rounded-full bg-amber-300/25 blur-3xl [animation-delay:-12s]" />

      <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <motion.p
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm font-medium text-white/80"
          >
            {greeting(new Date().getHours())}, {settings.name} 👋
          </motion.p>

          <h1 className="mt-2 flex flex-wrap items-baseline gap-x-3 font-extrabold tracking-tight">
            {beforeStart ? (
              <span className="text-4xl sm:text-5xl">
                Launch in <CountUp value={daysToLaunch} /> day{daysToLaunch === 1 ? '' : 's'} 🚀
              </span>
            ) : (
              <>
                <span className="text-6xl leading-none sm:text-7xl">
                  Day <CountUp value={Math.min(j.day, 120)} />
                </span>
                <span className="text-2xl text-white/70">/ {settings.targetDays}</span>
              </>
            )}
          </h1>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">🏁 Core ends {formatShort(coreEnd)} · {daysLeft} days left</span>
            <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">⏱ {settings.minutesPerDay} min/day · 6 + 1</span>
            <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">🎯 Job-ready by day 120</span>
          </div>

          {/* Level + XP */}
          <div className="mt-6 flex max-w-xl items-center gap-4 rounded-2xl bg-black/15 p-4 ring-1 ring-white/15 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.4 }}
              className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/20 text-3xl shadow-inner"
              aria-hidden
            >
              {lvl.current.emoji}
            </motion.div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate font-bold">
                  Level {lvl.level} · {lvl.current.title}
                </p>
                <p className="shrink-0 text-xs text-white/80">
                  <CountUp value={xp} /> XP
                </p>
              </div>
              <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuenow={Math.round(lvl.progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to next level">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 via-pink-300 to-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(3, lvl.progress * 100)}%` }}
                  transition={{ duration: 1.4, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />
                <div className="shimmer absolute inset-0" />
              </div>
              <p className="mt-1.5 text-xs text-white/75">
                {lvl.next ? `${lvl.next.min - xp} XP to ${lvl.next.emoji} ${lvl.next.title}` : 'Max level reached — you did it!'}
              </p>
            </div>
          </div>
        </div>

        {/* Rings */}
        <div className="flex items-center gap-6 justify-self-center">
          <ActivityRings rings={RINGS.map((r) => ({ ...r, value: values[r.key] }))} size={196} stroke={15}>
            <div>
              <p className="text-3xl font-extrabold">
                <CountUp value={j.todayMinutes} />
              </p>
              <p className="text-[11px] uppercase tracking-wider text-white/75">of {settings.minutesPerDay} min today</p>
            </div>
          </ActivityRings>
          <ul className="space-y-3 text-sm">
            {RINGS.map((r) => (
              <li key={r.key} className="flex items-center gap-2">
                <span className="size-3 rounded-full" style={{ background: `linear-gradient(135deg, ${r.from}, ${r.to})` }} />
                <span className="w-20 text-white/80">{r.label}</span>
                <span className="font-bold">
                  <CountUp value={Math.min(100, Math.round(values[r.key] * 100))} suffix="%" />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.section>
  );
}
