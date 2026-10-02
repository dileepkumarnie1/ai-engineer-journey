import { Check, ExternalLink as ExternalIcon, Play } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTimer } from '@/app/timer';
import { QuestionView } from '@/components/QuestionView';
import { Button, Card, ExternalLink, Icon } from '@/components/ui';
import type { LearningModule } from '@/content/schema';
import { isSafeUrl, setExplanation, setPrediction, setProofUrl, toggleBuildCheck, toggleExplainCovered } from '@/db/actions';
import type { ModuleProgress } from '@/db/db';
import { useModuleRow } from '@/db/hooks';
import { isBuildVerified, isExplained, MIN_EXPLANATION } from '@/lib/achievements';
import { cn } from '@/lib/cn';
import { XP_RULES } from '@/lib/gamification';
import { authoredQuestion, masteryCheck, seededRng } from '@/lib/quiz';

const field = 'w-full rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/5';

export function LoopStepper({ progress, learned }: { progress?: ModuleProgress; learned: boolean }) {
  const steps = [
    { id: 'predict', emoji: '🔮', label: 'Predict', done: progress?.predicted !== undefined },
    { id: 'pick', emoji: '📚', label: 'Learn', done: learned },
    { id: 'explain', emoji: '🗣️', label: 'Explain', done: isExplained(progress) },
    { id: 'build', emoji: '🛠️', label: 'Build', done: isBuildVerified(progress) },
    { id: 'quiz', emoji: '🎓', label: 'Prove', done: masteryCheck(progress).ready || progress?.status === 'done' },
  ];
  const next = steps.find((s) => !s.done);
  return (
    <nav aria-label="Learning loop" className="glass flex flex-wrap items-center gap-2 p-3">
      <span className="px-2 text-xs font-bold uppercase tracking-wider text-slate-500">Learning loop</span>
      {steps.map((s, i) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          aria-current={s === next ? 'step' : undefined}
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition hover:-translate-y-0.5',
            s.done
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : s === next
                ? 'border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/30'
                : 'border-slate-200 text-slate-500 dark:border-white/10',
          )}
        >
          <span aria-hidden>{s.done ? '✅' : s.emoji}</span>
          {i + 1}. {s.label}
        </a>
      ))}
    </nav>
  );
}

export function PredictCard({ module }: { module: LearningModule }) {
  const row = useModuleRow(module.id);
  const question = useMemo(() => authoredQuestion(module, 0, seededRng(module.id))!, [module]);
  const [pick, setPick] = useState<number>();
  if (row === undefined) return null;

  if (row?.predicted !== undefined && pick === undefined) {
    return (
      <Card id="predict" className="flex scroll-mt-24 items-center gap-3 text-sm">
        <span className="text-xl" aria-hidden>🔮</span>
        <p>
          <span className="font-semibold">Prediction made.</span>{' '}
          {row.predicted ? 'You called it. Now go deeper than the guess.' : 'You guessed differently. Watch for the moment it clicks.'}
        </p>
      </Card>
    );
  }

  const correct = pick === question.answer;
  return (
    <Card id="predict" className="scroll-mt-24 space-y-3 border-2 border-dashed border-violet-400/50">
      <div>
        <h2 className="text-lg font-semibold">🔮 Predict first</h2>
        <p className="text-sm text-slate-500">Guess before you learn. Committing to an answer, right or wrong, makes the real one stick.</p>
      </div>
      <QuestionView
        question={question}
        value={pick}
        revealed={pick !== undefined}
        onChange={(a) => {
          if (pick !== undefined || typeof a !== 'number') return;
          setPick(a);
          void setPrediction(module.id, a === question.answer);
        }}
      />
      {pick !== undefined && (
        <p className="text-sm font-medium">{correct ? '🎯 Good instinct! The lessons will show you why.' : '💡 Surprised? That surprise is exactly what makes it stick.'}</p>
      )}
    </Card>
  );
}

function ExplainEditor({ module, row }: { module: LearningModule; row: ModuleProgress | null }) {
  const [value, setValue] = useState(row?.explanation ?? '');
  const [saved, setSaved] = useState(true);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const len = value.trim().length;
  const covered = new Set(row?.explainCovered ?? []);

  return (
    <div className="space-y-3">
      <label htmlFor={`explain-${module.id}`} className="block rounded-xl bg-violet-500/10 p-3 text-sm font-medium">
        {module.explain}
      </label>
      <textarea
        id={`explain-${module.id}`}
        value={value}
        rows={5}
        maxLength={1500}
        placeholder="In your own words, no copying. Imagine explaining it to a teammate."
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          setSaved(false);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => void setExplanation(module.id, next).then(() => setSaved(true)), 600);
        }}
        className={field}
      />
      <p className="flex justify-between text-xs text-slate-500">
        <span>{len < MIN_EXPLANATION ? `${MIN_EXPLANATION - len} more characters to count` : `✅ Counts for +${XP_RULES.explain} XP`}</span>
        <span>{saved ? 'Saved' : 'Saving…'}</span>
      </p>
      {len >= MIN_EXPLANATION && (
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-semibold">Check yourself: did you cover these key ideas?</legend>
          {module.cards.map((c, i) => (
            <label key={c.title} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-2.5 text-sm dark:border-white/10">
              <input type="checkbox" checked={covered.has(i)} onChange={() => toggleExplainCovered(module.id, i)} className="mt-0.5 size-4 accent-emerald-500" />
              <span>
                <span className="font-medium">{c.title}</span>
                <span className="block text-xs text-slate-500">{c.text}</span>
              </span>
            </label>
          ))}
          {covered.size === module.cards.length && <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">🧠 Complete explanation. You really get this.</p>}
        </fieldset>
      )}
    </div>
  );
}

export function ExplainCard({ module }: { module: LearningModule }) {
  const row = useModuleRow(module.id);
  return (
    <Card id="explain" className="scroll-mt-24 space-y-3">
      <div>
        <h2 className="text-lg font-semibold">🗣️ Explain it back</h2>
        <p className="text-sm text-slate-500">If you can explain it simply, you understand it. This is where learning sticks.</p>
      </div>
      {row !== undefined && <ExplainEditor key={module.id} module={module} row={row} />}
    </Card>
  );
}

function ProofLink({ moduleId, initial }: { moduleId: string; initial: string }) {
  const [url, setUrl] = useState(initial);
  const [error, setError] = useState('');
  const save = async () => {
    const ok = await setProofUrl(moduleId, url);
    setError(ok ? '' : 'Use a full http(s):// link, e.g. your GitHub repo.');
  };
  const savedOk = initial && isSafeUrl(initial);
  return (
    <div>
      <label htmlFor={`proof-${moduleId}`} className="mb-1 block text-sm font-medium">Proof of work (repo, notebook, demo)</label>
      <div className="flex gap-2">
        <input
          id={`proof-${moduleId}`}
          type="url"
          inputMode="url"
          value={url}
          placeholder="https://github.com/you/…"
          onChange={(e) => setUrl(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === 'Enter' && void save()}
          aria-invalid={Boolean(error)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
        {savedOk && (
          <ExternalLink href={initial} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 px-3 text-sm text-violet-600 hover:bg-slate-100 dark:border-white/10 dark:text-violet-300 dark:hover:bg-white/5">
            Open <ExternalIcon className="size-3.5" />
          </ExternalLink>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-rose-600" role="alert">{error}</p>}
    </div>
  );
}

export function BuildCard({ module }: { module: LearningModule }) {
  const row = useModuleRow(module.id);
  const timer = useTimer();
  const done = new Set(row?.buildDone ?? []);
  const verified = isBuildVerified(row ?? undefined);
  return (
    <Card id="build" className="scroll-mt-24 space-y-4">
      <div className="flex items-start gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <Icon name="Hammer" className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">🛠️ Build it</h2>
          <p className="text-sm">{module.build}</p>
        </div>
      </div>
      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-semibold">Done when…</legend>
        {module.checks.map((c, i) => (
          <label key={c} className={cn('flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 text-sm', done.has(i) ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-slate-200 dark:border-white/10')}>
            <input type="checkbox" checked={done.has(i)} onChange={() => toggleBuildCheck(module.id, i)} className="size-4 accent-emerald-500" />
            <span className={cn(done.has(i) && 'text-slate-500 line-through')}>{c}</span>
          </label>
        ))}
      </fieldset>
      {row !== undefined && <ProofLink key={module.id} moduleId={module.id} initial={row?.proofUrl ?? ''} />}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => timer.start(module.id)} disabled={timer.running}>
          <Play className="size-4" /> Start focus session
        </Button>
        {verified && (
          <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <Check className="size-4" /> Build verified · +{XP_RULES.build} XP
          </p>
        )}
      </div>
    </Card>
  );
}
