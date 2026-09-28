import { motion } from 'motion/react';
import { useId, type ReactNode } from 'react';
import { CountUp } from '@/components/CountUp';
import type { Journey } from '@/hooks/useJourney';
import { cn } from '@/lib/cn';
import { diffDays, formatShort } from '@/lib/dates';
import { lastNDays, weekStrip, type DayStatus } from '@/lib/gamification';
import { cardHover, rise } from './motion';

function Tile({ label, children, accent }: { label: string; children: ReactNode; accent: string }) {
  return (
    <motion.div variants={rise} whileHover={cardHover} className="glass relative overflow-hidden p-5">
      <div className={cn('absolute -right-10 -top-10 size-32 rounded-full opacity-25 blur-2xl', accent)} />
      <p className="relative text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
      <div className="relative mt-2">{children}</div>
    </motion.div>
  );
}

const DOT: Record<DayStatus, string> = {
  done: 'bg-gradient-to-br from-orange-400 to-rose-500 text-white',
  today: 'border-2 border-dashed border-orange-400 text-orange-500',
  missed: 'bg-slate-200 text-slate-400 dark:bg-white/10',
  rest: 'bg-sky-500/15 text-sky-500',
  future: 'border border-slate-200 text-slate-400 dark:border-white/10',
  na: 'opacity-30 border border-slate-200 dark:border-white/10',
};

function StreakTile({ j }: { j: Journey }) {
  const week = weekStrip(j.today, j.schedule, j.minutes);
  return (
    <Tile label="Streak" accent="bg-orange-500">
      <div className="flex items-center gap-3">
        <span className={cn('text-4xl', j.streak > 0 && 'animate-flicker')} aria-hidden>🔥</span>
        <p className="text-4xl font-extrabold"><CountUp value={j.streak} /></p>
        <p className="text-sm text-slate-500">day{j.streak === 1 ? '' : 's'}<br /><span className="text-xs">best {j.bestStreak}</span></p>
      </div>
      <div className="mt-4 flex justify-between gap-1">
        {week.map((d, i) => (
          <motion.div
            key={d.date}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 + i * 0.05, type: 'spring', stiffness: 260, damping: 16 }}
            title={`${formatShort(d.date)} · ${d.status}${d.minutes ? ` · ${d.minutes} min` : ''}`}
            className={cn('grid size-8 place-items-center rounded-full text-[11px] font-bold', DOT[d.status])}
          >
            {d.status === 'rest' ? '☕' : 'MTWTFSS'[i]}
          </motion.div>
        ))}
      </div>
    </Tile>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const id = `spark${useId().replace(/[^\w-]/g, '')}`;
  const w = 220;
  const h = 48;
  const max = Math.max(60, ...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - (v / max) * (h - 6) - 3] as const);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} />
      <motion.path d={line} fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.3 }} />
    </svg>
  );
}

function HoursTile({ j }: { j: Journey }) {
  const days = lastNDays(j.minutes, j.today, 14);
  return (
    <Tile label="Hours studied" accent="bg-indigo-500">
      <p className="text-4xl font-extrabold">
        <CountUp value={j.totalMinutes / 60} decimals={1} /> <span className="text-lg font-semibold text-slate-400">h</span>
      </p>
      <p className="text-xs text-slate-500">Plan so far {(j.plannedMinutes / 60).toFixed(1)} h · last 14 days ↓</p>
      <Sparkline values={days.map((d) => d.minutes)} />
    </Tile>
  );
}

function PaceTile({ j }: { j: Journey }) {
  const clamped = Math.max(-5, Math.min(5, j.pace));
  const angle = (clamped / 5) * 90;
  const onTrack = Math.abs(j.pace) < 0.25;
  const label = onTrack ? 'On track' : j.pace > 0 ? 'Ahead' : 'Behind';
  return (
    <Tile label="Pace" accent={j.pace >= -0.25 ? 'bg-emerald-500' : 'bg-rose-500'}>
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-32 shrink-0 overflow-hidden" aria-hidden>
          <div className="absolute inset-x-0 top-0 h-32 rounded-full bg-[conic-gradient(from_270deg,#f43f5e_0deg,#f59e0b_60deg,#10b981_120deg,#10b981_180deg,transparent_180deg)] [mask:radial-gradient(circle,transparent_52%,black_53%)]" />
          <motion.div
            className="absolute bottom-0 left-1/2 h-14 w-1 -translate-x-1/2 origin-bottom rounded-full bg-slate-800 dark:bg-white"
            initial={{ rotate: -90 }}
            animate={{ rotate: angle }}
            transition={{ type: 'spring', stiffness: 60, damping: 10, delay: 0.4 }}
          />
          <div className="absolute bottom-0 left-1/2 size-3 -translate-x-1/2 translate-y-1/2 rounded-full bg-slate-800 dark:bg-white" />
        </div>
        <div>
          <p className={cn('text-2xl font-extrabold', onTrack || j.pace > 0 ? 'text-emerald-500' : 'text-rose-500')}>{label}</p>
          <p className="text-sm font-semibold">
            {onTrack ? '±0' : <CountUp value={j.pace} decimals={1} prefix={j.pace > 0 ? '+' : ''} />} days
          </p>
          <p className="text-xs text-slate-500">{j.coreDone.toFixed(1)} / {j.coreTotal} study days</p>
        </div>
      </div>
    </Tile>
  );
}

function FinishTile({ j }: { j: Journey }) {
  const daysToGo = j.projected ? Math.max(0, diffDays(j.today, j.projected)) : 0;
  const elapsed = Math.max(0, Math.min(1, j.day / j.settings.targetDays));
  return (
    <Tile label="Projected finish" accent="bg-fuchsia-500">
      <p className="text-4xl font-extrabold">{j.projected ? formatShort(j.projected) : '🎉 Done'}</p>
      <p className="text-xs text-slate-500">
        {j.projected ? <><CountUp value={daysToGo} /> days to go at current pace</> : 'Core plan complete!'}
      </p>
      <div className="mt-4">
        <div className="flex justify-between text-[11px] text-slate-500"><span>Day 1</span><span>Day {j.settings.targetDays}</span></div>
        <div className="relative mt-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500" initial={{ width: 0 }} animate={{ width: `${elapsed * 100}%` }} transition={{ duration: 1.2, delay: 0.3 }} />
        </div>
      </div>
    </Tile>
  );
}

export function StatTiles({ j }: { j: Journey }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StreakTile j={j} />
      <HoursTile j={j} />
      <PaceTile j={j} />
      <FinishTile j={j} />
    </div>
  );
}
