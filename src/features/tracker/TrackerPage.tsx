import { Pause, Play, RotateCcw, Save, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fmtClock, SEGMENT_LABEL, useTimer } from '@/app/timer';
import { Heatmap } from '@/components/Heatmap';
import { SessionPresetPicker } from '@/components/SessionPresetPicker';
import { Button, Card, PageHeader, ProgressRing } from '@/components/ui';
import { allModules, getModule } from '@/content';
import { addLog, deleteLog } from '@/db/actions';
import { useJourney, type Journey } from '@/hooks/useJourney';
import { cn } from '@/lib/cn';
import { addDays, diffDays, formatShort, isISODate } from '@/lib/dates';
import { studyDaysBetween, toContentIndex } from '@/lib/schedule';

const MOODS = ['😫', '😕', '😐', '🙂', '🤩'];

function ModuleSelect({ value, onChange, id }: { value?: string; onChange: (v?: string) => void; id: string }) {
  return (
    <select
      id={id}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900"
    >
      <option value="">— General study —</option>
      {allModules.map((m) => (
        <option key={m.id} value={m.id}>
          {m.title}
        </option>
      ))}
    </select>
  );
}

const SEGMENT_BAR = { learn: 'bg-violet-500', build: 'bg-amber-500', break: 'bg-emerald-500' } as const;

function FocusTimer({ defaultModule }: { defaultModule?: string }) {
  const t = useTimer();
  const [msg, setMsg] = useState('');
  const moduleId = t.moduleId ?? defaultModule;

  return (
    <Card className="flex flex-col items-center gap-4 text-center">
      <h2 className="self-start text-lg font-semibold">⏱ Focus session</h2>
      <div className="w-full text-left">
        <SessionPresetPicker />
      </div>
      <ProgressRing value={t.elapsedSec / t.totalSec} size={200} stroke={14} label="Session progress">
        <div>
          <p className="text-4xl font-extrabold tabular-nums">{fmtClock(t.elapsedSec)}</p>
          <p className="text-sm text-slate-500">of {fmtClock(t.totalSec)}</p>
          <p className="mt-1 text-sm font-semibold">
            {t.segment === 'done' ? '✅ Session done' : `${SEGMENT_LABEL[t.segment]} · ${fmtClock(t.segmentLeftSec)} left`}
          </p>
        </div>
      </ProgressRing>
      <div className="flex w-full gap-1 text-[11px]" aria-label="Session segments">
        {t.segments.map((s, i) => (
          <div
            key={i}
            style={{ flexGrow: s.sec }}
            className={cn(
              'basis-0 truncate rounded-lg py-1.5',
              i === t.segmentIndex ? `${SEGMENT_BAR[s.kind]} text-white` : i < t.segmentIndex ? 'bg-slate-300 dark:bg-white/20' : 'bg-slate-200 dark:bg-white/10',
            )}
            title={`${SEGMENT_LABEL[s.kind]} ${s.sec / 60} min`}
          >
            {s.kind === 'break' ? '☕' : `${SEGMENT_LABEL[s.kind]} ${s.sec / 60}`}
          </div>
        ))}
      </div>
      <div className="w-full text-left">
        <label htmlFor="timer-module" className="mb-1 block text-sm font-medium">Working on</label>
        <ModuleSelect id="timer-module" value={moduleId} onChange={t.setModule} />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {t.running ? (
          <Button onClick={t.pause}><Pause className="size-4" /> Pause</Button>
        ) : (
          <Button onClick={() => t.start(moduleId)} disabled={t.segment === 'done'}>
            <Play className="size-4" /> {t.elapsedSec > 0 ? 'Resume' : 'Start'}
          </Button>
        )}
        <Button variant="outline" onClick={t.reset} disabled={t.elapsedSec === 0}>
          <RotateCcw className="size-4" /> Reset
        </Button>
        <Button
          variant="success"
          disabled={t.focusSec < 60}
          onClick={async () => {
            const m = await t.logAndReset();
            setMsg(`Logged ${m} min ✔`);
          }}
        >
          <Save className="size-4" /> Log session
        </Button>
      </div>
      <p className="h-5 text-sm text-emerald-600" role="status">{msg}</p>
    </Card>
  );
}

function ManualLog({ today, defaultModule }: { today: string; defaultModule?: string }) {
  const [date, setDate] = useState(today);
  const [minutes, setMinutes] = useState(90);
  const [moduleId, setModuleId] = useState<string | undefined>(defaultModule);
  const [mood, setMood] = useState<number>();
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');
  const valid = isISODate(date) && diffDays(date, today) >= 0 && minutes >= 1 && minutes <= 600;

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">✍️ Log time manually</h2>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!valid) return;
          await addLog({ date, minutes, moduleId, mood, note: note.trim() || undefined });
          setNote('');
          setMsg(`Logged ${minutes} min for ${formatShort(date)} ✔`);
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="log-date" className="mb-1 block text-sm font-medium">Date</label>
            <input id="log-date" type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
          </div>
          <div>
            <label htmlFor="log-min" className="mb-1 block text-sm font-medium">Minutes</label>
            <div className="flex gap-2">
              <input id="log-min" type="number" min={1} max={600} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
              {[30, 60, 90].map((m) => (
                <button key={m} type="button" onClick={() => setMinutes(m)} className={cn('rounded-lg border px-2 text-xs', minutes === m ? 'border-violet-500 bg-violet-500/15' : 'border-slate-200 dark:border-white/10')}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="log-module" className="mb-1 block text-sm font-medium">Module</label>
          <ModuleSelect id="log-module" value={moduleId} onChange={setModuleId} />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium">Mood</p>
          <div className="flex gap-2" role="radiogroup" aria-label="Mood">
            {MOODS.map((f, i) => (
              <button key={f} type="button" role="radio" aria-checked={mood === i + 1} aria-label={`Mood ${i + 1} of 5`} onClick={() => setMood(i + 1)} className={cn('grid size-10 place-items-center rounded-xl border text-xl', mood === i + 1 ? 'border-violet-500 bg-violet-500/15' : 'border-slate-200 opacity-70 dark:border-white/10')}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="log-note" className="mb-1 block text-sm font-medium">One-line reflection</label>
          <input id="log-note" value={note} maxLength={280} onChange={(e) => setNote(e.target.value)} placeholder="What clicked today?" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={!valid}>Save log</Button>
          <span className="text-sm text-emerald-600" role="status">{msg}</span>
        </div>
      </form>
    </Card>
  );
}

function Charts({ j }: { j: Journey }) {
  const { weekly, burn, radar } = useMemo(() => {
    const s = j.schedule;
    const weeks = Math.ceil(j.finishDay / 7);
    const target = 6 * j.settings.minutesPerDay;
    const weekly = Array.from({ length: weeks }, (_, w) => {
      let min = 0;
      for (let d = 0; d < 7; d++) min += j.minutes.get(addDays(s.startDate, w * 7 + d)) ?? 0;
      return { week: `W${w + 1}`, hours: +(min / 60).toFixed(1), target: target / 60 };
    });
    const doneModules = allModules
      .map((m) => ({ m, p: j.mp.get(m.id) }))
      .filter((x) => x.p?.status === 'done' && x.p.completedAt);
    const burn = Array.from({ length: weeks }, (_, w) => {
      const end = addDays(s.startDate, w * 7 + 6);
      const elapsed = studyDaysBetween(s.startDate, addDays(end, 1), s);
      const planned = +Math.min(j.coreTotal, toContentIndex(elapsed, j.coreTotal, s.stretch ?? 1)).toFixed(1);
      const actual =
        diffDays(addDays(s.startDate, w * 7), j.today) >= 0
          ? doneModules
              .filter((x) => x.p!.completedAt!.slice(0, 10) <= end)
              .reduce((sum, x) => sum + x.m.studyDays, 0)
          : null;
      return { week: `W${w + 1}`, planned, actual };
    });
    const radar = j.skills.map((sk) => ({ skill: `${sk.emoji} ${sk.label}`, value: sk.score }));
    return { weekly, burn, radar };
  }, [j]);

  const axis = { fontSize: 11, fill: '#94a3b8' };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="mb-3 font-semibold">📊 Hours per week vs target</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
              <XAxis dataKey="week" tick={axis} />
              <YAxis tick={axis} />
              <Tooltip />
              <ReferenceLine y={weekly[0]?.target} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'target', fill: '#f59e0b', fontSize: 11 }} />
              <Bar dataKey="hours" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">📈 Burn-up: study days planned vs completed</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={burn}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
              <XAxis dataKey="week" tick={axis} />
              <YAxis tick={axis} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="planned" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="lg:col-span-2">
        <h2 className="mb-1 font-semibold">🕸 AI Engineer skill radar</h2>
        <p className="mb-3 text-xs text-slate-500">Scored by proven mastery: quiz 40%, completion 40%, confidence 20%.</p>
        <div className="h-80">
          <ResponsiveContainer>
            <RadarChart data={radar} outerRadius="72%">
              <PolarGrid stroke="#94a3b855" />
              <PolarAngleAxis dataKey="skill" tick={axis} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.35} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

export default function TrackerPage() {
  const j = useJourney();
  const recent = [...j.logs].reverse().slice(0, 12);

  return (
    <div className="space-y-6">
      <PageHeader icon="Clock" title="Tracker" subtitle={`Target: ${j.settings.minutesPerDay} min × 6 days a week`} gradient="from-sky-500 to-indigo-600" />
      <div className="grid gap-6 lg:grid-cols-2">
        <FocusTimer defaultModule={j.todayModule?.id} />
        <ManualLog today={j.today} defaultModule={j.todayModule?.id} />
      </div>

      <Card>
        <h2 className="mb-3 font-semibold">🗓 Activity heatmap</h2>
        <Heatmap start={j.settings.startDate} days={120} minutes={j.minutes} target={j.settings.minutesPerDay} today={j.today} restDay={j.settings.restDay} />
      </Card>

      <Charts j={j} />

      <Card>
        <h2 className="mb-3 font-semibold">🧾 Recent logs</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">No logs yet — start a focus session or log time above.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {recent.map((l) => (
              <li key={l.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="w-16 font-medium">{formatShort(l.date)}</span>
                <span className="w-16 tabular-nums">{l.minutes} min</span>
                <span className="text-lg">{l.mood ? MOODS[l.mood - 1] : ''}</span>
                <span className="min-w-0 flex-1 truncate text-slate-500">
                  {l.moduleId ? getModule(l.moduleId)?.title : 'General'}{l.note ? ` — ${l.note}` : ''}
                </span>
                <button type="button" onClick={() => l.id && deleteLog(l.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500" aria-label="Delete log">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
