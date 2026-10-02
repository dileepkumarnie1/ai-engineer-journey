import { Download, RotateCcw, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { Button, Card, PageHeader } from '@/components/ui';
import { saveSettings } from '@/db/actions';
import { downloadBackup, MAX_BACKUP_BYTES, parseBackup, resetAll, restoreBackup } from '@/db/backup';
import { useSettings } from '@/db/hooks';
import { cn } from '@/lib/cn';
import { isISODate, WEEKDAYS } from '@/lib/dates';

const field = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900';

export default function SettingsPage() {
  const s = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const onImport = async (file: File) => {
    if (file.size > MAX_BACKUP_BYTES) return setMsg({ ok: false, text: 'File is larger than 5 MB.' });
    const result = parseBackup(await file.text());
    if (!result.ok) return setMsg({ ok: false, text: result.error });
    if (!window.confirm('Replace ALL current progress with this backup?')) return;
    await restoreBackup(result.backup);
    setMsg({ ok: true, text: `Restored backup from ${result.backup.exportedAt.slice(0, 10)} ✔` });
  };

  return (
    <div className="space-y-6">
      <PageHeader icon="Wrench" title="Settings" subtitle="Your plan, your data" gradient="from-slate-500 to-slate-700" />

      <Card className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">Display name</label>
          <input id="name" className={field} value={s.name} maxLength={60} onChange={(e) => saveSettings({ name: e.target.value })} />
        </div>
        <div>
          <label htmlFor="goal" className="mb-1 flex justify-between text-sm font-medium">
            Your why
            <Link to="/welcome" className="text-xs font-normal text-violet-600 hover:underline dark:text-violet-300">Redo skills check →</Link>
          </label>
          <input id="goal" className={field} value={s.goal ?? ''} maxLength={200} placeholder="Why are you becoming an AI Engineer?" onChange={(e) => saveSettings({ goal: e.target.value })} />
        </div>
        <div>
          <label htmlFor="start" className="mb-1 block text-sm font-medium">Start date</label>
          <input
            id="start"
            type="date"
            className={field}
            value={s.startDate}
            onChange={(e) => isISODate(e.target.value) && saveSettings({ startDate: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="mins" className="mb-1 block text-sm font-medium">Minutes per study day</label>
          <input
            id="mins"
            type="number"
            min={15}
            max={480}
            step={15}
            className={field}
            value={s.minutesPerDay}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (v >= 15 && v <= 480) void saveSettings({ minutesPerDay: v });
            }}
          />
        </div>
        <div>
          <label htmlFor="rest" className="mb-1 block text-sm font-medium">Weekly rest / catch-up day</label>
          <select
            id="rest"
            className={field}
            value={s.restDay ?? 'none'}
            onChange={(e) => saveSettings({ restDay: e.target.value === 'none' ? null : Number(e.target.value) })}
          >
            <option value="none">No rest day (7 / week)</option>
            {WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
        </div>
        <fieldset>
          <legend className="mb-1 text-sm font-medium">Target</legend>
          <div className="flex gap-2">
            {([90, 120] as const).map((t) => (
              <button key={t} type="button" aria-pressed={s.targetDays === t} onClick={() => saveSettings({ targetDays: t })} className={cn('flex-1 rounded-xl border px-3 py-2 text-sm font-medium', s.targetDays === t ? 'border-violet-500 bg-violet-500 text-white' : 'border-slate-200 dark:border-white/10')}>
                {t} days
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-500">120 days spreads the same core modules over ~4 months; the job-ready sprint follows.</p>
        </fieldset>
        <fieldset>
          <legend className="mb-1 text-sm font-medium">Theme</legend>
          <div className="flex gap-2">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button key={t} type="button" aria-pressed={s.theme === t} onClick={() => saveSettings({ theme: t })} className={cn('flex-1 rounded-xl border px-3 py-2 text-sm font-medium capitalize', s.theme === t ? 'border-violet-500 bg-violet-500 text-white' : 'border-slate-200 dark:border-white/10')}>
                {t === 'dark' ? '🌙' : t === 'light' ? '☀️' : '🖥️'} {t}
              </button>
            ))}
          </div>
        </fieldset>
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">💾 Backup & restore</h2>
          <p className="text-sm text-slate-500">
            Progress is stored only in this browser (IndexedDB). Export a JSON backup weekly — clearing browser data deletes it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={downloadBackup}><Download className="size-4" /> Export JSON</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="size-4" /> Import JSON</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void onImport(f);
            }}
          />
          <Button
            variant="danger"
            onClick={async () => {
              if (!window.confirm('Delete ALL progress, logs and settings? Export a backup first.')) return;
              await resetAll();
              setMsg({ ok: true, text: 'All data cleared.' });
            }}
          >
            <RotateCcw className="size-4" /> Reset everything
          </Button>
        </div>
        {msg && (
          <p role="status" className={cn('rounded-xl p-3 text-sm', msg.ok ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300')}>
            {msg.text}
          </p>
        )}
      </Card>
    </div>
  );
}
