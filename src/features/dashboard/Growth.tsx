import { motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui';
import { saveSettings } from '@/db/actions';
import type { Journey } from '@/hooks/useJourney';
import { cn } from '@/lib/cn';
import { addDays } from '@/lib/dates';
import { skillLevel } from '@/lib/skills';
import { rise } from './motion';

const BAR = (score: number) =>
  score >= 80 ? 'from-emerald-500 to-lime-400' : score >= 50 ? 'from-violet-500 to-cyan-400' : score >= 20 ? 'from-amber-500 to-orange-400' : 'from-slate-400 to-slate-300';

export function SkillMapCard({ j }: { j: Journey }) {
  const overall = Math.round(j.skills.reduce((sum, s) => sum + s.score, 0) / j.skills.length);
  return (
    <motion.section variants={rise} className="glass p-6">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">🧭 AI Engineer skill map</h2>
        <p className="text-sm text-slate-500">
          Overall <span className="font-bold text-slate-900 dark:text-white">{overall}%</span> · {skillLevel(overall)}
        </p>
      </div>
      <p className="mb-5 text-sm text-slate-500">The skills AI Engineer job posts ask for, scored by what you've proven: quiz 40%, completion 40%, confidence 20%.</p>
      <ul className="grid gap-x-8 gap-y-4 md:grid-cols-2">
        {j.skills.map((s, i) => (
          <li key={s.id}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-semibold">{s.emoji} {s.label}</span>
              <span className="text-xs text-slate-500">{skillLevel(s.score)} · <span className="font-bold text-slate-900 dark:text-white">{s.score}%</span></span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10" role="progressbar" aria-valuenow={s.score} aria-valuemin={0} aria-valuemax={100} aria-label={s.label}>
              <motion.div
                className={cn('h-full rounded-full bg-gradient-to-r', BAR(s.score))}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(2, s.score)}%` }}
                transition={{ duration: 1, delay: 0.2 + i * 0.07 }}
              />
            </div>
            <p className="mt-1 truncate text-[11px] text-slate-500">{s.posting}</p>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}

export function ReplanCard({ j }: { j: Journey }) {
  const [busy, setBusy] = useState(false);
  if (!j.offerReplan) return null;
  const behind = Math.round(-j.pace);

  const switchPlan = async () => {
    if (!window.confirm('Switch to the 120-day plan? Module dates spread out; your progress, XP and streak stay exactly as they are.')) return;
    setBusy(true);
    await saveSettings({ targetDays: 120 });
  };

  return (
    <motion.section variants={rise} className="flex flex-wrap items-center gap-4 rounded-3xl border border-sky-400/40 bg-sky-500/10 p-5" role="region" aria-label="Plan check-in">
      <span className="text-4xl" aria-hidden>🫶</span>
      <div className="min-w-0 flex-1 basis-64">
        <p className="font-bold">Sustainable beats heroic.</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          You're about {behind} study days behind and your energy has dipped {j.lowSignals}× this week. That's a signal, not a failure. The{' '}
          <span className="font-semibold">120-day plan</span> keeps the same modules with more breathing room between them.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={switchPlan} disabled={busy}>Switch to 120 days</Button>
        <Button variant="ghost" onClick={() => saveSettings({ replanDismissedUntil: addDays(j.today, 7) })}>Not now</Button>
        <Link to="/recall" className="self-center text-sm font-medium text-sky-700 hover:underline dark:text-sky-300">Or just do a quick recall →</Link>
      </div>
    </motion.section>
  );
}
