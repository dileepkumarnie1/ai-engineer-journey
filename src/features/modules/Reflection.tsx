import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui';
import { setConfidence, setNotes } from '@/db/actions';
import { db } from '@/db/db';
import { cn } from '@/lib/cn';

const FACES = ['😵', '😕', '🙂', '😎', '🚀'];

function NotesEditor({ moduleId, initial }: { moduleId: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(true);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div>
      <label htmlFor={`notes-${moduleId}`} className="mb-1 flex justify-between text-sm font-medium">
        My notes <span className="text-xs text-slate-500">{saved ? 'Saved' : 'Saving…'}</span>
      </label>
      <textarea
        id={`notes-${moduleId}`}
        value={value}
        maxLength={5000}
        rows={5}
        placeholder="Key takeaways, links, questions…"
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          setSaved(false);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => void setNotes(moduleId, next).then(() => setSaved(true)), 600);
        }}
        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/5"
      />
    </div>
  );
}

export function Reflection({ moduleId }: { moduleId: string }) {
  const row = useLiveQuery(async () => (await db.moduleProgress.get(moduleId)) ?? null, [moduleId]);
  if (row === undefined) return null;

  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-semibold">🪞 Reflect</h2>
      <div>
        <p className="mb-2 text-sm font-medium">How confident do you feel?</p>
        <div className="flex gap-2" role="radiogroup" aria-label="Confidence">
          {FACES.map((f, i) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={row?.confidence === i + 1}
              aria-label={`Confidence ${i + 1} of 5`}
              onClick={() => setConfidence(moduleId, i + 1)}
              className={cn(
                'grid size-12 place-items-center rounded-xl border text-2xl transition',
                row?.confidence === i + 1 ? 'scale-110 border-violet-500 bg-violet-500/15' : 'border-slate-200 opacity-70 hover:opacity-100 dark:border-white/10',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <NotesEditor key={moduleId} moduleId={moduleId} initial={row?.notes ?? ''} />
    </Card>
  );
}
