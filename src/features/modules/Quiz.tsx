import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { QuestionView } from '@/components/QuestionView';
import type { LearningModule } from '@/content/schema';
import { recordQuizAttempt } from '@/db/actions';
import { useQuizAttempts } from '@/db/hooks';
import { cn } from '@/lib/cn';
import { buildQuiz, isAnswered, MASTERY, scoreQuiz, type Answer } from '@/lib/quiz';

export function Quiz({ module, best }: { module: LearningModule; best?: number }) {
  const attempts = useQuizAttempts(module.id);
  const [questions, setQuestions] = useState(() => buildQuiz(module));
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [submitted, setSubmitted] = useState(false);
  const [onlyWrong, setOnlyWrong] = useState(false);
  const { results, correct, score } = scoreQuiz(questions, answers);
  const allAnswered = questions.every((q) => isAnswered(q, answers[q.key]));
  const passed = score >= MASTERY.quiz;
  const wrongKeys = new Set(results.filter((r) => !r.correct).map((r) => r.key));
  const shown = submitted && onlyWrong ? questions.filter((q) => wrongKeys.has(q.key)) : questions;

  const submit = async () => {
    setSubmitted(true);
    await recordQuizAttempt(module.id, score, results);
  };

  const retry = () => {
    setQuestions(buildQuiz(module));
    setAnswers({});
    setSubmitted(false);
    setOnlyWrong(false);
  };

  return (
    <Card id="quiz" className="scroll-mt-24">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">🧠 Mastery check</h2>
        {best !== undefined && (
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <span className="flex h-5 items-end gap-0.5" aria-hidden>
              {attempts.slice(-6).map((a) => (
                <span
                  key={a.id}
                  className={cn('w-1.5 rounded-sm', a.score >= MASTERY.quiz ? 'bg-emerald-500' : 'bg-amber-400')}
                  style={{ height: `${Math.max(15, a.score)}%` }}
                />
              ))}
            </span>
            Best {best}% · {attempts.length} {attempts.length === 1 ? 'try' : 'tries'}
          </span>
        )}
      </div>
      <p className="mb-4 text-xs text-slate-500">
        Score {MASTERY.quiz}%+ to unlock completion. Options reshuffle every attempt, and these questions come back later in Daily Recall.
      </p>
      <div className="space-y-5">
        {shown.map((q) => (
          <QuestionView
            key={q.key}
            question={q}
            number={questions.indexOf(q) + 1}
            value={answers[q.key]}
            onChange={(a) => setAnswers((prev) => ({ ...prev, [q.key]: a }))}
            revealed={submitted}
          />
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {submitted && (
          <p
            role="status"
            className={cn(
              'rounded-xl p-3 text-sm font-semibold',
              passed ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
            )}
          >
            {passed
              ? `🎉 ${correct}/${questions.length} (${score}%): mastery check passed!`
              : `💪 ${correct}/${questions.length} (${score}%). You need ${MASTERY.quiz}%: read the explanations, then retry.`}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {submitted ? (
            <>
              {wrongKeys.size > 0 && (
                <Button variant="outline" size="sm" aria-pressed={onlyWrong} onClick={() => setOnlyWrong((v) => !v)}>
                  {onlyWrong ? 'Show all questions' : `Review ${wrongKeys.size} mistake${wrongKeys.size === 1 ? '' : 's'}`}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={retry}>
                Retry with new shuffle
              </Button>
            </>
          ) : (
            <Button onClick={submit} disabled={!allAnswered}>
              Check answers
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
