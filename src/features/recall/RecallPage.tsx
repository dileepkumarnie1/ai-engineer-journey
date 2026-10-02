import { ArrowRight, Check, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router';
import { buttonStyles } from '@/components/buttonStyles';
import { QuestionView } from '@/components/QuestionView';
import { Button, Card, PageHeader, ProgressBar } from '@/components/ui';
import { addLog, reviewRecallCard } from '@/db/actions';
import { useJourney } from '@/hooks/useJourney';
import { todayISO } from '@/lib/dates';
import { XP_RULES } from '@/lib/gamification';
import { isAnswered, isCorrect, type Answer } from '@/lib/quiz';
import { resolveCard, type RecallItem } from '@/lib/srs';
import { BoxChart, WeakSpotsCard } from './RecallWidgets';

interface Summary {
  total: number;
  correct: number;
  minutes: number;
}

function RecallSession({ items, onDone }: { items: RecallItem[]; onDone: (s: Summary) => void }) {
  const [queue, setQueue] = useState(items);
  const [pos, setPos] = useState(0);
  const [answer, setAnswer] = useState<Answer>();
  const [revealed, setRevealed] = useState(false);
  const [firstTry, setFirstTry] = useState<Record<string, boolean>>({});
  const [startedAt] = useState(() => Date.now());
  const item = queue[pos]!;
  // Missed cards are appended after the originals; those repeats are practice only.
  const secondLook = pos >= items.length;
  const graded = secondLook || item.id in firstTry;

  const grade = async (correct: boolean) => {
    setRevealed(true);
    if (graded) return;
    setFirstTry((g) => ({ ...g, [item.id]: correct }));
    if (!correct) {
      const again = resolveCard(item.id);
      if (again) setQueue((q) => [...q, again]);
    }
    await reviewRecallCard(item.id, correct);
  };

  const next = async () => {
    if (pos + 1 < queue.length) {
      setPos(pos + 1);
      setAnswer(undefined);
      setRevealed(false);
      return;
    }
    const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60_000));
    await addLog({ date: todayISO(), minutes });
    const results = Object.values(firstTry);
    onDone({ total: results.length, correct: results.filter(Boolean).length, minutes });
  };

  return (
    <Card className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
        <span>
          Card {pos + 1} / {queue.length}
          {secondLook && <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">second look</span>}
        </span>
        <span className="truncate">{item.source}</span>
      </div>
      <ProgressBar value={pos / queue.length} label="Recall progress" />

      <motion.div key={`${item.id}-${pos}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
        {item.kind === 'question' ? (
          <QuestionView question={item.question} value={answer} onChange={setAnswer} revealed={revealed} />
        ) : (
          <div className="space-y-3">
            <p className="text-lg font-semibold">{item.q}</p>
            {revealed ? (
              <p className="rounded-xl bg-violet-500/10 p-4 text-sm leading-relaxed">{item.a}</p>
            ) : (
              <p className="text-sm text-slate-500">Say your answer out loud first, then reveal.</p>
            )}
          </div>
        )}
      </motion.div>

      <div className="flex flex-wrap gap-2">
        {item.kind === 'question' && !revealed && (
          <Button onClick={() => grade(isCorrect(item.question, answer))} disabled={!isAnswered(item.question, answer)}>
            Check
          </Button>
        )}
        {item.kind === 'flash' && !revealed && <Button onClick={() => setRevealed(true)}>Reveal answer</Button>}
        {item.kind === 'flash' && revealed && !graded && (
          <>
            <Button variant="outline" onClick={() => grade(false)}>
              <X className="size-4" /> Missed it
            </Button>
            <Button variant="success" onClick={() => grade(true)}>
              <Check className="size-4" /> Got it
            </Button>
          </>
        )}
        {revealed && (item.kind === 'question' || graded) && (
          <Button onClick={next}>
            {pos + 1 < queue.length ? 'Next' : 'Finish'} <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function RecallPage() {
  const j = useJourney();
  const [items, setItems] = useState<RecallItem[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  const start = () => {
    setSummary(null);
    setItems(j.recall.map((id) => resolveCard(id)).filter((x): x is RecallItem => x !== null));
  };

  return (
    <div className="space-y-6">
      <PageHeader icon="Brain" title="Daily Recall" subtitle="Spaced repetition: a few minutes a day beats cramming." gradient="from-fuchsia-500 to-violet-600" />

      {items && !summary ? (
        <RecallSession items={items} onDone={setSummary} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <Card className="space-y-5 lg:col-span-7">
            {summary ? (
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-2 text-center">
                <p className="text-5xl" aria-hidden>{summary.correct === summary.total ? '🏆' : '🧠'}</p>
                <p className="text-2xl font-extrabold">
                  {summary.correct} / {summary.total} recalled
                </p>
                <p className="text-sm text-slate-500">
                  +{summary.total * XP_RULES.review} XP · {summary.minutes} min logged · streak safe for today ✅
                </p>
              </motion.div>
            ) : (
              <div>
                <p className="text-4xl font-extrabold">{j.recall.length}</p>
                <p className="text-sm text-slate-500">cards ready today</p>
              </div>
            )}
            {j.recall.length > 0 ? (
              <Button onClick={start}>
                {summary ? 'Keep going' : 'Start recall'} <ArrowRight className="size-4" />
              </Button>
            ) : j.cards.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Your deck fills up as you take module mastery checks.{' '}
                {j.nextModules[0] && (
                  <Link to={`/module/${j.nextModules[0].module.id}#quiz`} className={buttonStyles('outline', 'sm', 'ml-1')}>
                    Take one now
                  </Link>
                )}
              </p>
            ) : (
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">✨ All caught up. Come back tomorrow.</p>
            )}
            {j.cards.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Memory strength (cards per box · next gap)</p>
                <BoxChart cards={j.cards} />
              </div>
            )}
          </Card>
          <div className="lg:col-span-5">
            <WeakSpotsCard j={j} />
          </div>
        </div>
      )}
    </div>
  );
}
