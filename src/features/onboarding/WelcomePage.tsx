import { ArrowLeft, ArrowRight, Rocket } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, Card } from '@/components/ui';
import { phases } from '@/content';
import { saveSettings } from '@/db/actions';
import { db, DEFAULT_SETTINGS, type ExperienceLevel, type Settings, type SkillArea } from '@/db/db';
import { cn } from '@/lib/cn';
import { isISODate, todayISO, WEEKDAYS } from '@/lib/dates';
import { LEVELS, SKILL_AREAS, testOutArea } from '@/lib/onboarding';

const field = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900';
const GOAL_IDEAS = [
  'Land an AI Engineer role within 4 months',
  'Build AI tools that automate data testing at work',
  'Lead GenAI projects on our data platform',
];
const STEPS = ['Your why', 'Your skills', 'Your rhythm'];

function Wizard({ initial, hasRow }: { initial: Settings; hasRow: boolean }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial.name);
  const [goal, setGoal] = useState(initial.goal ?? '');
  const [experience, setExperience] = useState<Partial<Record<SkillArea, ExperienceLevel>>>(initial.experience ?? {});
  const [startDate, setStartDate] = useState(hasRow ? initial.startDate : todayISO());
  const [minutesPerDay, setMinutes] = useState(initial.minutesPerDay);
  const [restDay, setRestDay] = useState(initial.restDay);

  const testOutCount = phases
    .flatMap((p) => p.modules.filter((m) => m.kind === 'learn' && testOutArea(experience, p.id)))
    .length;

  const finish = async (skip = false) => {
    await saveSettings(
      skip
        ? { onboarded: true }
        : { name: name.trim() || DEFAULT_SETTINGS.name, goal: goal.trim() || undefined, experience, startDate, minutesPerDay, restDay, onboarded: true },
    );
    navigate('/', { replace: true });
  };

  return (
    <Card className="mx-auto max-w-2xl space-y-6 p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white">
            <Rocket className="size-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Welcome, future AI Engineer</h1>
            <p className="text-sm text-slate-500">Three quick questions to tailor your journey.</p>
          </div>
        </div>
        <button type="button" onClick={() => finish(true)} className="text-sm text-slate-500 hover:underline">
          Skip
        </button>
      </div>

      <ol className="flex gap-2" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? 'step' : undefined} className="flex-1">
            <div className={cn('h-1.5 rounded-full', i <= step ? 'bg-gradient-to-r from-violet-500 to-cyan-400' : 'bg-slate-200 dark:bg-white/10')} />
            <p className={cn('mt-1 text-xs', i === step ? 'font-semibold' : 'text-slate-500')}>{s}</p>
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
          {step === 0 && (
            <>
              <div>
                <label htmlFor="ob-name" className="mb-1 block text-sm font-medium">What should we call you?</label>
                <input id="ob-name" className={field} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label htmlFor="ob-goal" className="mb-1 block text-sm font-medium">Why are you doing this? 🎯</label>
                <textarea
                  id="ob-goal"
                  className={field}
                  rows={3}
                  maxLength={200}
                  value={goal}
                  placeholder="Your reason, in one line. We'll show it on tough days."
                  onChange={(e) => setGoal(e.target.value)}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {GOAL_IDEAS.map((g) => (
                    <button key={g} type="button" onClick={() => setGoal(g)} className="rounded-full border border-slate-200 px-3 py-1 text-xs hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/5">
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Be honest. Areas you rate <span className="font-semibold">Solid</span> unlock a ⚡ fast-track: pass the mastery check to complete a module
                without doing the courses.
              </p>
              <ul className="space-y-3">
                {SKILL_AREAS.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3 dark:border-white/10">
                    <div className="min-w-0">
                      <p className="font-semibold">{a.emoji} {a.label}</p>
                      <p className="text-xs text-slate-500">{a.hint}</p>
                    </div>
                    <div role="radiogroup" aria-label={a.label} className="flex gap-1 rounded-xl bg-slate-200/60 p-1 dark:bg-white/5">
                      {LEVELS.map((l) => (
                        <button
                          key={l.value}
                          type="button"
                          role="radio"
                          aria-checked={(experience[a.id] ?? 0) === l.value}
                          onClick={() => setExperience((e) => ({ ...e, [a.id]: l.value }))}
                          className={cn('rounded-lg px-3 py-1.5 text-xs font-medium', (experience[a.id] ?? 0) === l.value ? 'bg-white shadow dark:bg-white/15' : 'text-slate-500')}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
              {testOutCount > 0 && (
                <p className="rounded-xl bg-amber-500/15 p-3 text-sm text-amber-800 dark:text-amber-200">⚡ You can test out of {testOutCount} modules.</p>
              )}
            </>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ob-start" className="mb-1 block text-sm font-medium">Start date</label>
                <input id="ob-start" type="date" className={field} value={startDate} onChange={(e) => isISODate(e.target.value) && setStartDate(e.target.value)} />
              </div>
              <div>
                <label htmlFor="ob-rest" className="mb-1 block text-sm font-medium">Weekly rest day</label>
                <select id="ob-rest" className={field} value={restDay ?? 'none'} onChange={(e) => setRestDay(e.target.value === 'none' ? null : Number(e.target.value))}>
                  <option value="none">No rest day</option>
                  {WEEKDAYS.map((d, i) => (
                    <option key={d} value={i}>{d}</option>
                  ))}
                </select>
              </div>
              <fieldset className="sm:col-span-2">
                <legend className="mb-1 text-sm font-medium">Minutes per study day</legend>
                <div className="flex flex-wrap gap-2">
                  {[45, 60, 90, 120].map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={minutesPerDay === m}
                      onClick={() => setMinutes(m)}
                      className={cn('flex-1 rounded-xl border px-3 py-2 text-sm font-medium', minutesPerDay === m ? 'border-violet-500 bg-violet-500 text-white' : 'border-slate-200 dark:border-white/10')}
                    >
                      {m} min
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Sustainable beats heroic. On low-energy days a ⚡ 15-min micro session or Daily Recall keeps your streak, and every 7 study days
                  earns a ❄️ streak freeze.
                </p>
              </fieldset>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between gap-3">
        <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>
            Next <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button variant="success" onClick={() => finish()}>
            Start my journey 🚀
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function WelcomePage() {
  const row = useLiveQuery(async () => (await db.settings.get('app')) ?? null, []);
  if (row === undefined) return null;
  return <Wizard initial={row ?? DEFAULT_SETTINGS} hasRow={row !== null} />;
}
