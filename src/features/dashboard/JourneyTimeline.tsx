import { motion } from 'motion/react';
import { Link } from 'react-router';
import { Icon } from '@/components/ui';
import { phases } from '@/content';
import type { Journey } from '@/hooks/useJourney';
import { cn } from '@/lib/cn';
import { hues } from '@/lib/colors';
import { formatShort } from '@/lib/dates';
import { phaseCompletion } from '@/lib/progress';
import { rise } from './motion';

/** Horizontal race-track of all phases with a "today" line and a rocket at actual progress. */
export function JourneyTimeline({ j }: { j: Journey }) {
  const total = j.plan.at(-1)!.endIndex;
  const pct = (n: number) => `${Math.max(0, Math.min(100, (n / total) * 100))}%`;
  const segments = phases.map((p) => {
    const rows = j.plan.filter((r) => r.phaseId === p.id);
    const start = rows[0]!.startIndex;
    const end = rows.at(-1)!.endIndex;
    return { p, start, end, startDate: rows[0]!.startDate, endDate: rows.at(-1)!.endDate, done: phaseCompletion(p, j.mp, j.cp) };
  });
  // Actual position counts finished core days, plus any sprint progress.
  const sprintDone = segments.filter((s) => s.p.buffer).reduce((sum, s) => sum + (s.end - s.start) * s.done, 0);
  const actual = j.coreDone + sprintDone;

  return (
    <motion.section variants={rise} className="glass p-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">🛣️ Your 120-day journey</h2>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 bg-slate-800 dark:bg-white" /> Plan today</span>
          <span className="flex items-center gap-1.5">🚀 You</span>
          <Link to="/roadmap" className="font-medium text-violet-600 hover:underline dark:text-violet-300">Full roadmap →</Link>
        </div>
      </div>

      <div className="relative pt-6">
        {/* Markers */}
        <div className="absolute inset-x-0 top-0 h-full">
          <div className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: pct(j.coreTotal) }}>
            <span className="text-sm" title="Day 90 — core plan complete">🏁</span>
          </div>
          <div className="absolute right-0 top-0 translate-x-1/2 text-sm" title="Day 120 — job-ready">🏆</div>
          <motion.div
            className="absolute top-3 bottom-8 w-0.5 -translate-x-1/2 rounded-full bg-slate-800 dark:bg-white"
            initial={{ left: '0%' }}
            animate={{ left: pct(j.plannedDone) }}
            transition={{ duration: 1.2, delay: 0.3 }}
          />
          <motion.div
            className="absolute -top-1 -translate-x-1/2 text-2xl drop-shadow"
            initial={{ left: '0%' }}
            animate={{ left: pct(actual) }}
            transition={{ type: 'spring', stiffness: 40, damping: 12, delay: 0.5 }}
            aria-label={`Your progress: ${actual.toFixed(1)} of ${total} study days`}
          >
            <span className="inline-block rotate-45">🚀</span>
          </motion.div>
        </div>

        {/* Track */}
        <div className="relative flex gap-1">
          {segments.map(({ p, start, end, startDate, endDate, done }, i) => {
            const h = hues[p.hue];
            const width = ((end - start) / total) * 100;
            return (
              <Link
                key={p.id}
                to={`/roadmap#${p.id}`}
                className="group relative"
                style={{ width: `${width}%` }}
                title={`P${p.order} ${p.title} · ${formatShort(startDate)} → ${formatShort(endDate)} · ${Math.round(done * 100)}%`}
              >
                <div className={cn('relative h-5 overflow-hidden rounded-full transition group-hover:scale-y-125', h.soft, p.buffer && 'border border-dashed', p.buffer && h.border)}>
                  <motion.div
                    className={cn('h-full rounded-full bg-gradient-to-r', h.gradient)}
                    initial={{ width: 0 }}
                    animate={{ width: `${done * 100}%` }}
                    transition={{ duration: 1, delay: 0.4 + i * 0.08 }}
                  />
                </div>
                <div className="mt-2 flex flex-col items-center gap-1 text-center">
                  {width > 3.5 && (
                    <span className={cn('grid size-7 place-items-center rounded-lg bg-gradient-to-br text-white shadow transition group-hover:-translate-y-0.5', h.gradient)}>
                      <Icon name={p.icon} className="size-3.5" />
                    </span>
                  )}
                  {width > 5 && <span className="line-clamp-2 text-[10px] font-semibold leading-tight text-slate-600 dark:text-slate-300">{p.title}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
