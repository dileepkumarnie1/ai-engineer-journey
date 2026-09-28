import { ArrowRight, Check, Coffee, Pause, Play } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router';
import { fmtClock, useTimer } from '@/app/timer';
import { buttonStyles } from '@/components/buttonStyles';
import { FlowDiagram } from '@/components/FlowDiagram';
import { Icon } from '@/components/ui';
import { getPhase } from '@/content';
import type { Journey } from '@/hooks/useJourney';
import { cn } from '@/lib/cn';
import { hues } from '@/lib/colors';
import { formatLong } from '@/lib/dates';
import { rise } from './motion';

function Step({ done, active, emoji, label, sub }: { done: boolean; active: boolean; emoji: string; label: string; sub: string }) {
  return (
    <div className={cn('flex min-w-0 flex-1 items-center gap-3 rounded-2xl border p-3 transition', done ? 'border-emerald-500/40 bg-emerald-500/10' : active ? 'border-violet-500/50 bg-violet-500/10' : 'border-slate-200 dark:border-white/10')}>
      <div className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-white text-xl shadow-sm dark:bg-white/10">
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <motion.span key="done" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} className="grid size-full place-items-center rounded-xl bg-emerald-500 text-white">
              <Check className="size-5" />
            </motion.span>
          ) : (
            <motion.span key="todo" initial={{ scale: 0 }} animate={{ scale: 1 }}>{emoji}</motion.span>
          )}
        </AnimatePresence>
        {active && !done && <span className="absolute -right-1 -top-1 size-3 animate-ping rounded-full bg-violet-500" />}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{sub}</p>
      </div>
    </div>
  );
}

export function TodayMission({ j }: { j: Journey }) {
  const timer = useTimer();
  const { settings } = j;
  const learnMin = Math.round(settings.minutesPerDay * (2 / 3));
  const module = j.todayModule;
  const phase = j.todayPlan ? getPhase(j.todayPlan.phaseId) : undefined;
  const h = phase ? hues[phase.hue] : hues.violet;
  const learnDone = j.todayMinutes >= learnMin;
  const buildDone = j.todayMinutes >= settings.minutesPerDay;
  const catchUp = j.nextModules[0]?.module;

  return (
    <motion.section variants={rise} className={cn('relative rounded-[1.75rem] bg-gradient-to-br p-[1.5px] shadow-xl', h.gradient)}>
      <div className="relative h-full overflow-hidden rounded-[calc(1.75rem-1.5px)] bg-white p-6 dark:bg-[#0b1020]">
        <div className={cn('absolute -right-20 -top-20 size-64 rounded-full bg-gradient-to-br opacity-20 blur-3xl', h.gradient)} />
        <div className="relative flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Today's mission · {formatLong(j.today)}</p>
          {module && <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', h.soft, h.text)}>{phase?.title}</span>}
        </div>

        {j.day < 1 ? (
          <div className="relative mt-5 flex flex-wrap items-center gap-6">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-7xl" aria-hidden>🚀</motion.div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">Countdown to launch</h2>
              <p className="mt-1 text-slate-600 dark:text-slate-300">Warm up with the roadmap videos and set up your free LLM keys.</p>
              <Link to="/module/p0-role" className={buttonStyles('primary', 'md', 'mt-4')}>Preview day 1 <ArrowRight className="size-4" /></Link>
            </div>
          </div>
        ) : !module ? (
          <div className="relative mt-5 flex flex-wrap items-center gap-6">
            <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="grid size-20 place-items-center rounded-3xl bg-amber-500/15 text-amber-500" aria-hidden>
              <Coffee className="size-10" />
            </motion.div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">Recharge day ☕</h2>
              <p className="mt-1 text-slate-600 dark:text-slate-300">Rest well — or use it to catch up if you're behind.</p>
              {catchUp && (
                <Link to={`/module/${catchUp.id}`} className={buttonStyles('outline', 'md', 'mt-4')}>
                  Catch up: {catchUp.title} <ArrowRight className="size-4" />
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="relative mt-4 space-y-5">
            <div className="flex items-start gap-4">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className={cn('grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg', h.gradient)}
              >
                <Icon name={module.icon} className="size-8" />
              </motion.div>
              <div className="min-w-0">
                <h2 className="text-2xl font-bold leading-tight">{module.title}</h2>
                <p className="mt-1 text-slate-600 dark:text-slate-300">{module.tagline}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Step done={learnDone} active={!learnDone} emoji="📚" label={`Learn · ${learnMin} min`} sub="Watch / read your picks" />
              <Step done={buildDone} active={learnDone && !buildDone} emoji="🛠" label={`Build · ${settings.minutesPerDay - learnMin} min`} sub={module.build} />
              <Step done={j.todayReflected} active={buildDone && !j.todayReflected} emoji="🪞" label="Reflect · 1 min" sub="Mood + one-line takeaway" />
            </div>

            <FlowDiagram steps={module.flow} dotClass={h.dot} />

            <div className="flex flex-wrap items-center gap-3">
              {timer.running || timer.elapsedSec > 0 ? (
                <div className="flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-2.5 text-white dark:bg-white/10">
                  <span className={cn('size-2.5 rounded-full', timer.running ? 'animate-pulse bg-emerald-400' : 'bg-amber-400')} />
                  <span className="font-semibold tabular-nums">{fmtClock(timer.elapsedSec)}</span>
                  <span className="text-sm text-white/70">{timer.segment === 'learn' ? '📚 Learning' : timer.segment === 'build' ? '🛠 Building' : '✅ Done'}</span>
                  <button type="button" onClick={timer.running ? timer.pause : () => timer.start()} className="rounded-lg p-1 hover:bg-white/15" aria-label={timer.running ? 'Pause' : 'Resume'}>
                    {timer.running ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </button>
                </div>
              ) : (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => timer.start(module.id)}
                  className="animate-glow inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-500/30"
                >
                  <Play className="size-5 fill-white" /> Start {settings.minutesPerDay}-min session
                </motion.button>
              )}
              <Link to={`/module/${module.id}`} className={buttonStyles('outline')}>
                Open module <ArrowRight className="size-4" />
              </Link>
              {j.todayMinutes > 0 && !j.todayReflected && (
                <Link to="/tracker" className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-300">Log reflection →</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
