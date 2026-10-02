import { PRESETS, useTimer } from '@/app/timer';
import { useSettings } from '@/db/hooks';
import { cn } from '@/lib/cn';

export function SessionPresetPicker() {
  const t = useTimer();
  const { minutesPerDay } = useSettings();
  const locked = t.running || t.elapsedSec > 0;
  const current = PRESETS.find((p) => p.id === t.preset)!;
  return (
    <div className="space-y-1.5">
      <div role="radiogroup" aria-label="Session size" className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={t.preset === p.id}
            disabled={locked && t.preset !== p.id}
            title={p.hint}
            onClick={() => t.setPreset(p.id)}
            className={cn(
              'rounded-xl border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40',
              t.preset === p.id
                ? 'border-violet-500 bg-violet-500/15 text-violet-700 dark:text-violet-200'
                : 'border-slate-200 hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/5',
            )}
          >
            {p.emoji} {p.id === 'standard' ? `Standard ${minutesPerDay} min` : p.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">{current.hint}</p>
    </div>
  );
}
