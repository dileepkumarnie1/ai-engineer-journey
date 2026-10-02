import { cn } from '@/lib/cn';
import { isCorrect, type Answer, type McqQuestion, type OrderQuestion, type Question } from '@/lib/quiz';

function McqOptions({ q, value, onChange, revealed }: { q: McqQuestion; value?: Answer; onChange: (a: Answer) => void; revealed: boolean }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {q.options.map((opt, oi) => {
        const picked = value === oi;
        const isRight = revealed && oi === q.answer;
        const isWrong = revealed && picked && oi !== q.answer;
        return (
          <button
            key={opt}
            type="button"
            disabled={revealed}
            aria-pressed={picked}
            onClick={() => onChange(oi)}
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
  );
}

function OrderPicker({ q, value, onChange, revealed }: { q: OrderQuestion; value?: Answer; onChange: (a: Answer) => void; revealed: boolean }) {
  const picked = Array.isArray(value) ? value : [];
  const pool = q.shuffled.filter((s) => !picked.includes(s));
  return (
    <div className="space-y-2">
      <ol aria-label="Your order" className="flex min-h-11 flex-wrap items-center gap-2 rounded-xl border border-dashed border-slate-300 p-2 dark:border-white/15">
        {picked.length === 0 && <li className="px-1 text-xs text-slate-500">Tap the steps below in order…</li>}
        {picked.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              disabled={revealed}
              onClick={() => onChange(picked.filter((x) => x !== s))}
              aria-label={`Step ${i + 1}: ${s}. Tap to remove.`}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-sm',
                !revealed
                  ? 'border-violet-500 bg-violet-500/10'
                  : q.steps[i] === s
                    ? 'border-emerald-500 bg-emerald-500/15'
                    : 'border-rose-500 bg-rose-500/15',
              )}
            >
              {i + 1}. {s}
            </button>
          </li>
        ))}
      </ol>
      {!revealed && pool.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pool.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange([...picked, s])}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-sm hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/5"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function QuestionView({
  question,
  value,
  onChange,
  revealed,
  number,
}: {
  question: Question;
  value?: Answer;
  onChange: (a: Answer) => void;
  revealed: boolean;
  number?: number;
}) {
  const correct = revealed && isCorrect(question, value);
  return (
    <fieldset>
      <legend className="mb-2 font-medium">
        {number !== undefined && `${number}. `}
        {question.q}
      </legend>
      {question.kind === 'mcq' ? (
        <McqOptions q={question} value={value} onChange={onChange} revealed={revealed} />
      ) : (
        <OrderPicker q={question} value={value} onChange={onChange} revealed={revealed} />
      )}
      {revealed && (
        <p
          className={cn(
            'mt-2 rounded-xl p-3 text-sm',
            correct ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200' : 'bg-amber-500/15 text-amber-900 dark:text-amber-100',
          )}
        >
          <span className="font-semibold">{correct ? '✅ Right. ' : '💡 Why: '}</span>
          {question.why}
        </p>
      )}
    </fieldset>
  );
}
