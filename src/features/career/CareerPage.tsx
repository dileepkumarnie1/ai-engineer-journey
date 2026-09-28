import { ArrowDown, Check, ExternalLink as ExternalIcon, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Card, ExternalLink, PageHeader, ProgressRing } from '@/components/ui';
import { careerChecklist, flashcards, resumeRewrites } from '@/content';
import { addApplication, deleteApplication, toggleCareer, updateApplicationStatus } from '@/db/actions';
import type { ApplicationStatus } from '@/db/db';
import { useApplications, useCareerSet } from '@/db/hooks';
import { useJourney } from '@/hooks/useJourney';
import { cn } from '@/lib/cn';
import { formatShort } from '@/lib/dates';

const STATUSES: { id: ApplicationStatus; label: string; tone: string }[] = [
  { id: 'wishlist', label: '⭐ Wishlist', tone: 'bg-slate-500/15' },
  { id: 'applied', label: '📨 Applied', tone: 'bg-sky-500/15' },
  { id: 'interview', label: '🎤 Interview', tone: 'bg-amber-500/15' },
  { id: 'offer', label: '🎉 Offer', tone: 'bg-emerald-500/15' },
  { id: 'rejected', label: '🧊 Closed', tone: 'bg-rose-500/15' },
];

const isHttpUrl = (s: string) => {
  try {
    const u = new URL(s);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
};

function Flashcard({ q, a }: { q: string; a: string }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      aria-pressed={flipped}
      className="group h-44 w-full text-left [perspective:1000px]"
    >
      <div className={cn('relative size-full transition-transform duration-500 [transform-style:preserve-3d]', flipped && '[transform:rotateY(180deg)]')}>
        <div className="absolute inset-0 flex flex-col justify-between rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-4 text-white [backface-visibility:hidden]">
          <p className="font-semibold">{q}</p>
          <p className="text-xs text-white/70">Tap to reveal ↻</p>
        </div>
        <div className="absolute inset-0 flex items-center rounded-2xl bg-white p-4 text-sm shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)] dark:bg-slate-800">
          {a}
        </div>
      </div>
    </button>
  );
}

function Applications({ today }: { today: string }) {
  const apps = useApplications();
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [url, setUrl] = useState('');
  const urlOk = !url || isHttpUrl(url);
  const valid = company.trim() && role.trim() && urlOk;

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">🗂 Application tracker</h2>
      <form
        className="mb-4 grid gap-2 sm:grid-cols-[1fr_1fr_1.4fr_auto]"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!valid) return;
          await addApplication({ company: company.trim().slice(0, 100), role: role.trim().slice(0, 100), url: url || undefined, status: 'applied', date: today });
          setCompany('');
          setRole('');
          setUrl('');
        }}
      >
        <input aria-label="Company" placeholder="Company" value={company} maxLength={100} onChange={(e) => setCompany(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
        <input aria-label="Role" placeholder="Role (e.g. AI Engineer)" value={role} maxLength={100} onChange={(e) => setRole(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" />
        <input aria-label="Job link" aria-invalid={!urlOk} placeholder="https://… (optional)" value={url} maxLength={500} onChange={(e) => setUrl(e.target.value.trim())} className={cn('rounded-xl border bg-white px-3 py-2 text-sm dark:bg-slate-900', urlOk ? 'border-slate-200 dark:border-white/10' : 'border-rose-500')} />
        <Button type="submit" disabled={!valid}><Plus className="size-4" /> Add</Button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Badge key={s.id} className={s.tone}>{s.label} · {apps.filter((a) => a.status === s.id).length}</Badge>
        ))}
      </div>

      {apps.length === 0 ? (
        <p className="text-sm text-slate-500">No applications yet. Target: 5 per week from day 91.</p>
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-white/10">
          {apps.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
              <span className="w-14 text-xs text-slate-500">{formatShort(a.date)}</span>
              <span className="min-w-0 flex-1">
                <span className="font-medium">{a.company}</span> · {a.role}
                {a.url && isHttpUrl(a.url) && (
                  <ExternalLink href={a.url} className="ml-2 inline-flex items-center text-violet-500"><ExternalIcon className="size-3.5" /><span className="sr-only">Open job ad</span></ExternalLink>
                )}
              </span>
              <select
                aria-label={`Status for ${a.company}`}
                value={a.status}
                onChange={(e) => a.id && updateApplicationStatus(a.id, e.target.value as ApplicationStatus)}
                className="rounded-lg border border-slate-200 bg-transparent px-2 py-1 text-xs dark:border-white/10"
              >
                {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <button type="button" onClick={() => a.id && deleteApplication(a.id)} className="rounded-lg p-1.5 text-slate-400 hover:text-rose-500" aria-label={`Delete ${a.company}`}>
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function CareerPage() {
  const j = useJourney();
  const done = useCareerSet();
  const groups = [...new Set(careerChecklist.map((c) => c.group))];

  return (
    <div className="space-y-6">
      <PageHeader icon="Briefcase" title="Career hub" subtitle="Turn learning into offers" gradient="from-indigo-500 to-blue-700" />

      <Card className="flex flex-wrap items-center gap-6">
        <ProgressRing value={j.readiness / 100} size={120} stroke={11} label={`Job readiness ${j.readiness}%`}>
          <div><p className="text-2xl font-extrabold">{j.readiness}%</p><p className="text-[11px] text-slate-500">ready</p></div>
        </ProgressRing>
        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          {[
            ['📚 Learning', j.learning, '50%'],
            ['🛠 Projects', j.projectsFrac, '30%'],
            ['💼 Career', j.careerFrac, '20%'],
          ].map(([label, v, w]) => (
            <div key={String(label)} className="rounded-2xl bg-slate-100 p-3 dark:bg-white/5">
              <p className="text-sm font-medium">{label} <span className="text-xs text-slate-500">weight {w}</span></p>
              <p className="text-2xl font-bold">{Math.round(Number(v) * 100)}%</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">✅ Career checklist</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((g) => (
            <div key={g}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{g}</p>
              <ul className="space-y-2">
                {careerChecklist.filter((c) => c.group === g).map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => toggleCareer(c.id)}
                      aria-pressed={done.has(c.id)}
                      className={cn('flex w-full items-center gap-3 rounded-xl border p-2.5 text-left text-sm transition', done.has(c.id) ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5')}
                    >
                      <span className={cn('grid size-5 shrink-0 place-items-center rounded-md border', done.has(c.id) ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 dark:border-white/20')}>
                        {done.has(c.id) && <Check className="size-3.5" />}
                      </span>
                      <span className={cn(done.has(c.id) && 'text-slate-500 line-through')}>{c.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">🔁 Résumé glow-up: tester → AI engineer</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {resumeRewrites.map((r) => (
            <div key={r.before} className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
              <p className="rounded-lg bg-rose-500/10 p-2 text-sm text-slate-600 line-through decoration-rose-400 dark:text-slate-400">{r.before}</p>
              <ArrowDown className="mx-auto my-2 size-4 text-slate-400" aria-hidden />
              <p className="rounded-lg bg-emerald-500/10 p-2 text-sm font-medium">{r.after}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">Replace X% / Y% with your real measured capstone numbers.</p>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold">🃏 Interview flashcards</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {flashcards.map((f) => <Flashcard key={f.q} {...f} />)}
        </div>
      </section>

      <Applications today={j.today} />
    </div>
  );
}
