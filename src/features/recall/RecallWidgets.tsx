import { ArrowRight, Brain } from 'lucide-react';
import { Link } from 'react-router';
import { buttonStyles } from '@/components/buttonStyles';
import { Icon } from '@/components/ui';
import type { ReviewCard } from '@/db/db';
import type { Journey } from '@/hooks/useJourney';
import { cn } from '@/lib/cn';
import { formatShort } from '@/lib/dates';
import { BOX_DAYS } from '@/lib/srs';

const BOX_COLORS = ['bg-rose-400', 'bg-amber-400', 'bg-lime-400', 'bg-emerald-500', 'bg-cyan-500'];

/** How many cards sit in each Leitner box: a picture of memory strength. */
export function BoxChart({ cards }: { cards: ReviewCard[] }) {
  const counts = BOX_DAYS.map((_, i) => cards.filter((c) => c.box === i + 1).length);
  const max = Math.max(1, ...counts);
  return (
    <div className="flex items-end gap-2" aria-label="Cards per memory box">
      {counts.map((n, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[11px] font-semibold tabular-nums">{n}</span>
          <div className="flex h-14 w-full items-end rounded-md bg-slate-200/60 dark:bg-white/5">
            <div className={cn('w-full rounded-md', BOX_COLORS[i])} style={{ height: `${(n / max) * 100}%` }} />
          </div>
          <span className="text-[10px] text-slate-500">{BOX_DAYS[i]}d</span>
        </div>
      ))}
    </div>
  );
}

export function DailyRecallCard({ j }: { j: Journey }) {
  const due = j.recall.length;
  const minutes = Math.max(1, Math.ceil(due / 3));
  return (
    <section className="glass flex h-full flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Brain className="size-5 text-fuchsia-500" aria-hidden /> Daily recall
          </h2>
          <p className="text-sm text-slate-500">Review just before you would forget.</p>
        </div>
        {due > 0 && (
          <span className="rounded-full bg-fuchsia-500 px-3 py-1 text-xs font-bold text-white">
            {due} due · ~{minutes} min
          </span>
        )}
      </div>
      {j.cards.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Your deck is empty. Take a module's <span className="font-semibold">mastery check</span>: every question you answer joins your deck and
          returns on a 1 → 3 → 7 → 14 → 30-day rhythm.
        </p>
      ) : (
        <BoxChart cards={j.cards} />
      )}
      <div className="mt-auto flex flex-wrap items-center gap-3">
        {due > 0 ? (
          <Link to="/recall" className={buttonStyles('primary')}>
            Start recall <ArrowRight className="size-4" />
          </Link>
        ) : j.cards.length > 0 ? (
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            ✨ All caught up{j.nextReview ? ` · next review ${formatShort(j.nextReview)}` : ''}
          </p>
        ) : (
          j.nextModules[0] && (
            <Link to={`/module/${j.nextModules[0].module.id}#quiz`} className={buttonStyles('outline')}>
              Take a mastery check <ArrowRight className="size-4" />
            </Link>
          )
        )}
      </div>
    </section>
  );
}

export function WeakSpotsCard({ j }: { j: Journey }) {
  return (
    <section className="glass flex h-full flex-col p-6">
      <h2 className="text-lg font-bold">🎯 Weak spots</h2>
      <p className="mb-4 text-sm text-slate-500">From your quiz scores, confidence and recall misses.</p>
      {j.weakSpots.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Nothing shaky right now. 💪 Quizzes below 70%, low confidence or repeated recall misses will show up here.
        </p>
      ) : (
        <ul className="space-y-2">
          {j.weakSpots.map((w) => (
            <li key={w.module.id}>
              <Link
                to={`/module/${w.module.id}#quiz`}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 p-3 transition hover:border-amber-400 hover:bg-amber-500/5 dark:border-white/10"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-300">
                  <Icon name={w.module.icon} className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{w.module.title}</p>
                  <p className="truncate text-xs text-slate-500">{w.reasons.join(' · ')}</p>
                </div>
                <span className="text-xs font-semibold text-amber-600 group-hover:underline dark:text-amber-300">Revisit →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
