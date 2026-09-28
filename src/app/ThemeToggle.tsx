import { Monitor, Moon, Sun } from 'lucide-react';
import { saveSettings } from '@/db/actions';
import type { Settings } from '@/db/db';
import { cn } from '@/lib/cn';

type Theme = Settings['theme'];

const OPTIONS: { id: Theme; label: string; Icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'dark', label: 'Dark', Icon: Moon },
  { id: 'system', label: 'System', Icon: Monitor },
];

/** Segmented Light / Dark / System control. */
export function ThemeToggle({ theme }: { theme: Theme }) {
  return (
    <div role="radiogroup" aria-label="Theme" className="flex gap-1 rounded-xl bg-slate-200/70 p-1 dark:bg-white/5">
      {OPTIONS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={theme === id}
          title={`${label} theme`}
          onClick={() => saveSettings({ theme: id })}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition',
            theme === id ? 'bg-white text-slate-900 shadow dark:bg-white/15 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
          )}
        >
          <Icon className="size-3.5" aria-hidden /> {label}
        </button>
      ))}
    </div>
  );
}

/** Compact button that cycles Light → Dark → System (mobile header). */
export function ThemeCycleButton({ theme }: { theme: Theme }) {
  const idx = OPTIONS.findIndex((o) => o.id === theme);
  const current = OPTIONS[idx] ?? OPTIONS[1]!;
  const next = OPTIONS[(idx + 1) % OPTIONS.length]!;
  return (
    <button
      type="button"
      onClick={() => saveSettings({ theme: next.id })}
      className="rounded-lg p-2"
      aria-label={`Theme: ${current.label}. Switch to ${next.label}`}
      title={`Theme: ${current.label}`}
    >
      <current.Icon className="size-5" />
    </button>
  );
}
