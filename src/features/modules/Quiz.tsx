import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import type { LearningModule } from '@/content/schema';
import { saveQuizScore } from '@/db/actions';
import { cn } from '@/lib/cn';

export function Quiz({ module, best }: { module: LearningModule; best?: number }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const total = module.quiz.length;
  const correct = module.quiz.filter((q, i) => answers[i] === q.answer).length;

  const submit = async () => {
    setSubmitted(true);
    await saveQuizScore(module.id, Math.round((correct / total) * 100));
  };

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">🧠 Quick self-check</h2>
        {best !== undefined && <span className="text-sm text-slate-500">Best: {best}%</span>}
      </div>
      <div className="space-y-5">
        {module.quiz.map((q, qi) => (
          <fieldset key={q.q}>
            <legend className="mb-2 font-medium">
              {qi + 1}. {q.q}
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((opt, oi) => {
                const picked = answers[qi] === oi;
                const isRight = submitted && oi === q.answer;
                const isWrong = submitted && picked && oi !== q.answer;
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={submitted}
                    aria-pressed={picked}
                    onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-left text-sm transition',
                      isRight
                        ? 'border-emerald-500 bg-emerald-500/15'
                        : isWrong
                          ? 'border-rose-500 bg-rose-500/15'
                          : picked
                            ? 'border-violet-500 bg-violet-500/10'
                            : 'border-slate-200 hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/5',
                    )}
                  >
                    {isRight ? '✅ ' : isWrong ? '❌ ' : ''}
                    {opt}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3">
        {submitted ? (
          <>
            <p className="font-semibold">
              {correct}/{total} correct {correct === total ? '🎉' : '💪'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
              }}
            >
              Retry
            </Button>
          </>
        ) : (
          <Button onClick={submit} disabled={Object.keys(answers).length < total}>
            Check answers
          </Button>
        )}
      </div>
    </Card>
  );
}
