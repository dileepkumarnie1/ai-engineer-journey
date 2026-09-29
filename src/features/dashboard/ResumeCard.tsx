import { ArrowRight, Play, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTimer } from '@/app/timer';
import { Icon } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatMeta, ytThumb } from '@/lib/formats';
import type { ResumeTarget } from '@/lib/resume';
import { rise } from './motion';

const GUIDE_KEY = 'onboarding-dismissed';

const STEPS = [
  { emoji: '🗺️', title: 'Open today\'s module', text: 'Each day has one module. It\'s already chosen for you.' },
  { emoji: '🎯', title: 'Pick a course', text: 'Tap "Add to my plan" — the top one is our recommendation.' },
  { emoji: '⏱️', title: 'Press Start', text: '60 min learn + 30 min build. The timer tracks it for you.' },
  { emoji: '✅', title: 'Tick & reflect', text: 'Tick lessons as you go. Come back tomorrow — we remember.' },
];

const readDismissed = () => {
  try {
    return localStorage.getItem(GUIDE_KEY) === '1';
  } catch {
    return false;
  }
};

function Thumb({ target }: { target: ResumeTarget }) {
  const course = target.course ?? target.recommended;
  if (course.youtubeId) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl sm:w-56">
        <img src={ytThumb(course.youtubeId)} alt="" className="size-full object-cover" />
        <span className="absolute inset-0 grid place-items-center bg-black/25">
          <span className="grid size-12 place-items-center rounded-full bg-white/90 text-violet-600 shadow-xl"><Play className="size-5 translate-x-0.5 fill-current" /></span>
        </span>
      </div>
    );
  }
  const f = formatMeta[course.format];
  return (
    <div className={cn('grid aspect-video w-full place-items-center rounded-2xl bg-gradient-to-br text-white sm:w-56', f.gradient)}>
      <Icon name={target.module.icon} className="size-12 animate-float" />
    </div>
  );
}

/** First-run guide for new users; "continue where you left off" for everyone else. */
export function ResumeCard({ target }: { target: ResumeTarget | null }) {
  const timer = useTimer();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(readDismissed);

  if (!target) return null;
  const href = `/module/${target.module.id}${target.hash}`;
  const go = () => {
    if (!timer.running) timer.start(target.module.id);
    navigate(href);
  };

  if (target.isNewUser && !dismissed) {
    return (
      <motion.section variants={rise} className="relative overflow-hidden rounded-[1.75rem] border-2 border-violet-500/40 bg-white p-6 shadow-xl dark:bg-[#0b1020]">
        <div className="absolute -left-20 -top-20 size-64 rounded-full bg-violet-500/20 blur-3xl" />
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(GUIDE_KEY, '1');
            } catch {
              // ignore: the guide simply shows again next time
            }
            setDismissed(true);
          }}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
          aria-label="Hide the getting-started guide"
        >
          <X className="size-4" />
        </button>
        <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">New here? Start in 4 easy steps</p>
        <h2 className="relative mt-1 text-2xl font-extrabold">Welcome aboard 👋 Here's how it works</h2>
        <ol className="relative mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.12 }}
              className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5"
            >
              <span className="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-violet-500 text-xs font-bold text-white">{i + 1}</span>
              <p className="text-3xl" aria-hidden>{s.emoji}</p>
              <p className="mt-2 font-semibold">{s.title}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{s.text}</p>
            </motion.li>
          ))}
        </ol>
        <div className="relative mt-6 flex flex-wrap items-center gap-3">
          <Link
            to={href}
            className="animate-glow inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-7 py-4 text-lg font-bold text-white shadow-xl shadow-violet-500/30 transition hover:scale-[1.03]"
          >
            <Play className="size-5 fill-white" /> Start my first lesson
          </Link>
          <p className="text-sm text-slate-500">
            First up: <span className="font-semibold text-slate-800 dark:text-slate-200">{target.module.title}</span> · we recommend{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{target.recommended.title}</span>
          </p>
        </div>
      </motion.section>
    );
  }

  const heading =
    target.mode === 'continue' ? 'Continue where you left off' : target.mode === 'finish' ? 'Almost there — wrap up this module' : 'Pick up here';
  const detail =
    target.mode === 'continue'
      ? `Next: ${target.lessonLabel}`
      : target.mode === 'finish'
        ? 'All lessons ticked — take the quick quiz and mark it complete'
        : `Choose a course to begin — we recommend "${target.recommended.title}"`;
  const cta = target.mode === 'continue' ? 'Continue learning' : target.mode === 'finish' ? 'Finish module' : 'Choose a course';

  return (
    <motion.section variants={rise} className="glass relative overflow-hidden p-5">
      <div className="absolute -right-16 -top-16 size-48 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <Thumb target={target} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">▶ {heading}</p>
          <h2 className="mt-1 truncate text-xl font-bold">{target.module.title}</h2>
          {target.course && <p className="truncate text-sm text-slate-500">{target.course.title} · {target.course.provider}</p>}
          <p className="mt-2 text-sm font-medium">{detail}</p>
          {target.course && (
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500" initial={{ width: 0 }} animate={{ width: `${target.courseProgress * 100}%` }} transition={{ duration: 1, delay: 0.3 }} />
              </div>
              <span className="text-xs font-semibold text-slate-500">{Math.round(target.courseProgress * 100)}%</span>
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <Link to={`/module/${target.module.id}${target.hash}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 font-bold text-white shadow-lg transition hover:scale-[1.03]">
            {cta} <ArrowRight className="size-4" />
          </Link>
          {target.mode === 'continue' && !timer.running && (
            <button type="button" onClick={go} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:border-white/15 dark:hover:bg-white/10">
              <Play className="size-4" /> Continue + start timer
            </button>
          )}
        </div>
      </div>
    </motion.section>
  );
}
