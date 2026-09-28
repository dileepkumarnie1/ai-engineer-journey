import { addDays, diffDays, formatShort, weekday, type ISODate } from '@/lib/dates';
import { cn } from '@/lib/cn';

const level = (min: number, target: number) => {
  if (min <= 0) return 'bg-slate-200 dark:bg-white/[0.06]';
  const r = min / target;
  if (r < 0.34) return 'bg-emerald-200 dark:bg-emerald-900';
  if (r < 0.67) return 'bg-emerald-400 dark:bg-emerald-700';
  if (r < 1) return 'bg-emerald-500 dark:bg-emerald-500';
  return 'bg-emerald-600 dark:bg-emerald-400';
};

/** GitHub-style activity grid from the start date, one column per week. */
export function Heatmap({
  start,
  days,
  minutes,
  target,
  today,
  restDay,
}: {
  start: ISODate;
  days: number;
  minutes: Map<ISODate, number>;
  target: number;
  today: ISODate;
  restDay: number | null;
}) {
  const lead = weekday(start);
  const gridStart = addDays(start, -lead);
  const totalCells = Math.ceil((lead + days) / 7) * 7;
  const weeks: ISODate[][] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = addDays(gridStart, i);
    (weeks[Math.floor(i / 7)] ??= []).push(d);
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1" role="img" aria-label="Daily study activity heatmap">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((d) => {
              const inRange = diffDays(start, d) >= 0 && diffDays(d, addDays(start, days - 1)) >= 0;
              const m = minutes.get(d) ?? 0;
              const rest = restDay !== null && weekday(d) === restDay;
              return (
                <div
                  key={d}
                  title={inRange ? `${formatShort(d)} · ${m} min${rest ? ' · rest day' : ''}` : undefined}
                  className={cn(
                    'size-3.5 rounded-[4px]',
                    !inRange ? 'opacity-0' : level(m, target),
                    inRange && rest && m === 0 && 'opacity-40',
                    d === today && 'ring-2 ring-violet-500 ring-offset-1 ring-offset-transparent',
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
        Less
        {[0, 20, 50, 80, 100].map((v) => (
          <span key={v} className={cn('size-3 rounded-[3px]', level(v, 90))} />
        ))}
        More
      </div>
    </div>
  );
}
