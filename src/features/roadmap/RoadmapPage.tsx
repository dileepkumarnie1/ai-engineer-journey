import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { Badge, Card, Icon, PageHeader, ProgressBar, ProgressRing } from '@/components/ui';
import { phases } from '@/content';
import { useJourney } from '@/hooks/useJourney';
import { cn } from '@/lib/cn';
import { hues } from '@/lib/colors';
import { formatShort } from '@/lib/dates';
import { moduleCompletion, phaseCompletion } from '@/lib/progress';

export default function RoadmapPage() {
  const j = useJourney();
  const { hash } = useLocation();
  const planById = new Map(j.plan.map((p) => [p.moduleId, p]));

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  return (
    <div>
      <PageHeader icon="Map" title="Your roadmap" subtitle={`${j.coreTotal} study-day core plan (days 1–90) + ${j.plan.length ? j.plan.at(-1)!.endIndex - j.coreTotal : 0}-day job-ready sprint (days 91–120) · 6 study days + 1 rest day`} />

      {/* Metro-style overview */}
      <Card className="mb-8 overflow-x-auto">
        <div className="relative flex min-w-[860px] items-start justify-between px-4 py-2">
          <div className="absolute left-10 right-10 top-7 h-1 rounded-full bg-gradient-to-r from-sky-500 via-amber-500 to-indigo-500 opacity-60" />
          {phases.map((p) => {
            const v = phaseCompletion(p, j.mp, j.cp);
            return (
              <a key={p.id} href={`#${p.id}`} className="relative z-10 flex w-24 flex-col items-center gap-2 text-center">
                <div className={cn('grid size-11 place-items-center rounded-full bg-gradient-to-br text-white shadow-lg ring-4 ring-white dark:ring-[#070b17]', hues[p.hue].gradient)}>
                  {v >= 1 ? <Check className="size-5" /> : <Icon name={p.icon} className="size-5" />}
                </div>
                <span className="text-[11px] font-semibold leading-tight">{p.title}</span>
                <span className="text-[10px] text-slate-500">{Math.round(v * 100)}%</span>
              </a>
            );
          })}
        </div>
      </Card>

      <div className="space-y-10">
        {phases.map((p) => {
          const h = hues[p.hue];
          const first = planById.get(p.modules[0]!.id)!;
          const last = planById.get(p.modules.at(-1)!.id)!;
          const days = p.modules.reduce((s, m) => s + m.studyDays, 0);
          const v = phaseCompletion(p, j.mp, j.cp);
          return (
            <section key={p.id} id={p.id} className="scroll-mt-24">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                className={cn('relative mb-4 flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-3xl bg-gradient-to-br p-5 text-white shadow-xl', h.gradient)}
              >
                <div className="flex items-center gap-4">
                  <div className="grid size-14 place-items-center rounded-2xl bg-white/20">
                    <Icon name={p.icon} className="size-7" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                      Phase {p.order} · {days} study days · {formatShort(first.startDate)} → {formatShort(last.endDate)}
                    </p>
                    <h2 className="text-2xl font-bold">{p.title}</h2>
                    <p className="text-sm text-white/90">{p.goal}</p>
                  </div>
                </div>
                <ProgressRing value={v} size={72} stroke={8} color="#fff">
                  <span className="text-sm font-bold">{Math.round(v * 100)}%</span>
                </ProgressRing>
              </motion.div>

              <ol className="relative ml-6 space-y-3 border-l-2 border-dashed border-slate-300 pl-8 dark:border-white/15">
                {p.modules.map((m) => {
                  const plan = planById.get(m.id)!;
                  const status = j.mp.get(m.id)?.status ?? 'not-started';
                  const c = moduleCompletion(m, j.mp, j.cp);
                  const isToday = j.todayPlan?.moduleId === m.id;
                  return (
                    <li key={m.id} className="relative">
                      <span
                        className={cn(
                          'absolute -left-[45px] top-4 grid size-7 place-items-center rounded-full border-2 text-xs font-bold',
                          status === 'done'
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : status === 'in-progress'
                              ? cn('animate-pulse border-transparent text-white', h.dot)
                              : 'border-slate-300 bg-white text-slate-500 dark:border-white/20 dark:bg-slate-900',
                        )}
                        aria-label={status}
                      >
                        {status === 'done' ? <Check className="size-4" /> : m.studyDays}
                      </span>
                      <Link
                        to={`/module/${m.id}`}
                        className={cn('glass flex flex-wrap items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-lg', isToday && 'ring-2 ring-violet-500')}
                      >
                        <div className={cn('grid size-11 place-items-center rounded-xl', h.soft, h.text)}>
                          <Icon name={m.icon} className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">{m.title}</h3>
                            {m.kind === 'project' && <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-300">🛠 Project</Badge>}
                            {isToday && <Badge className="bg-violet-500 text-white">Today</Badge>}
                          </div>
                          <p className="truncate text-sm text-slate-500 dark:text-slate-400">{m.tagline}</p>
                        </div>
                        <div className="w-40 text-right text-xs text-slate-500">
                          <p>{formatShort(plan.startDate)} → {formatShort(plan.endDate)}</p>
                          <ProgressBar value={c} className="mt-2" label={`${m.title} progress`} />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
