import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Badge, Card, Icon, PageHeader, ProgressRing } from '@/components/ui';
import { getPhase, projects } from '@/content';
import { setMilestoneStatus } from '@/db/actions';
import type { MilestoneStatus } from '@/db/db';
import { useMilestoneMap } from '@/db/hooks';
import { cn } from '@/lib/cn';
import { hues } from '@/lib/colors';
import type { IconName } from '@/lib/icons';

const COLUMNS: { id: MilestoneStatus; label: string; tone: string }[] = [
  { id: 'todo', label: '📝 To do', tone: 'bg-slate-500/10' },
  { id: 'doing', label: '⚙️ Doing', tone: 'bg-amber-500/10' },
  { id: 'done', label: '✅ Done', tone: 'bg-emerald-500/10' },
];

const ARCH: { icon: IconName; label: string; sub: string; tone: string }[][] = [
  [{ icon: 'Users', label: 'Tester / UI', sub: 'Streamlit or React', tone: 'from-slate-500 to-slate-700' }],
  [{ icon: 'Server', label: 'FastAPI', sub: 'Azure Container Apps', tone: 'from-sky-500 to-blue-600' }],
  [{ icon: 'Workflow', label: 'LangGraph orchestrator', sub: 'state · checkpoints · approval', tone: 'from-violet-500 to-purple-600' }],
  [
    { icon: 'Route', label: 'Planner', sub: 'RAG over STTM', tone: 'from-amber-500 to-orange-600' },
    { icon: 'Code2', label: 'SQL agent', sub: 'text-to-SQL tests', tone: 'from-amber-500 to-orange-600' },
    { icon: 'Plug', label: 'Executor', sub: 'read-only MCP', tone: 'from-amber-500 to-orange-600' },
    { icon: 'FileText', label: 'Analyst', sub: 'RCA + report', tone: 'from-amber-500 to-orange-600' },
  ],
  [
    { icon: 'Boxes', label: 'Azure AI Search', sub: 'mapping docs', tone: 'from-cyan-500 to-sky-600' },
    { icon: 'Database', label: 'Databricks SQL', sub: 'sample warehouse', tone: 'from-rose-500 to-red-600' },
    { icon: 'Eye', label: 'Langfuse', sub: 'traces + cost', tone: 'from-emerald-500 to-teal-600' },
    { icon: 'FlaskConical', label: 'DeepEval + Ragas', sub: 'CI gate', tone: 'from-fuchsia-500 to-pink-600' },
  ],
];

function ArchitectureDiagram() {
  return (
    <div className="space-y-2" role="img" aria-label="DataSentinel AI architecture">
      {ARCH.map((row, i) => (
        <div key={i}>
          <div className="flex flex-wrap justify-center gap-2">
            {row.map((n) => (
              <div key={n.label} className="flex min-w-36 items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-white/5">
                <span className={cn('grid size-8 place-items-center rounded-lg bg-gradient-to-br text-white', n.tone)}>
                  <Icon name={n.icon} className="size-4" />
                </span>
                <span className="leading-tight">
                  <span className="block text-xs font-semibold">{n.label}</span>
                  <span className="block text-[10px] text-slate-500">{n.sub}</span>
                </span>
              </div>
            ))}
          </div>
          {i < ARCH.length - 1 && <div className="mx-auto h-4 w-0.5 bg-slate-300 dark:bg-white/20" />}
        </div>
      ))}
    </div>
  );
}

export default function ProjectsPage() {
  const status = useMilestoneMap();
  const [activeId, setActiveId] = useState(projects[0]!.id);
  const project = projects.find((p) => p.id === activeId)!;
  const get = (id: string): MilestoneStatus => status.get(id) ?? 'todo';
  const done = project.milestones.filter((m) => get(m.id) === 'done').length;

  const move = (id: string, dir: -1 | 1) => {
    const order: MilestoneStatus[] = ['todo', 'doing', 'done'];
    const next = order[order.indexOf(get(id)) + dir];
    if (next) void setMilestoneStatus(id, next);
  };

  return (
    <div className="space-y-6">
      <PageHeader icon="Hammer" title="Projects" subtitle="Portfolio pieces that prove you're an AI engineer" gradient="from-amber-500 to-orange-600" />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Projects">
        {projects.map((p) => {
          const d = p.milestones.filter((m) => get(m.id) === 'done').length;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={p.id === activeId}
              onClick={() => setActiveId(p.id)}
              className={cn(
                'flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition',
                p.id === activeId ? 'border-violet-500 bg-violet-500 text-white shadow-lg' : 'border-slate-300 hover:bg-slate-100 dark:border-white/15 dark:hover:bg-white/5',
              )}
            >
              <Icon name={p.icon} className="size-4" /> {p.title}
              <span className="rounded-full bg-black/10 px-2 text-xs dark:bg-white/10">{d}/{p.milestones.length}</span>
            </button>
          );
        })}
      </div>

      <Card className="flex flex-wrap items-center gap-6">
        <ProgressRing value={done / project.milestones.length} size={96}>
          <span className="text-lg font-bold">{Math.round((done / project.milestones.length) * 100)}%</span>
        </ProgressRing>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{project.title}</h2>
          <p className="text-slate-600 dark:text-slate-300">{project.summary}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {project.stack.map((s) => <Badge key={s}>{s}</Badge>)}
          </div>
        </div>
      </Card>

      {project.id === 'capstone' && (
        <Card>
          <h2 className="mb-4 font-semibold">🏗 Architecture</h2>
          <ArchitectureDiagram />
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <section key={col.id} className={cn('rounded-2xl p-3', col.tone)} aria-label={col.label}>
            <h3 className="mb-3 px-1 text-sm font-semibold">{col.label}</h3>
            <ul className="space-y-2">
              {project.milestones
                .filter((m) => get(m.id) === col.id)
                .map((m) => {
                  const ph = getPhase(m.phaseId)!;
                  return (
                    <li key={m.id} className="glass flex items-start gap-2 p-3">
                      <span className={cn('mt-0.5 size-2.5 shrink-0 rounded-full', hues[ph.hue].dot)} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{m.title}</p>
                        <p className="text-[11px] text-slate-500">P{ph.order} · {ph.title}</p>
                      </div>
                      <div className="flex">
                        <button type="button" disabled={col.id === 'todo'} onClick={() => move(m.id, -1)} className="rounded p-1 hover:bg-slate-200 disabled:opacity-20 dark:hover:bg-white/10" aria-label={`Move "${m.title}" back`}>
                          <ChevronLeft className="size-4" />
                        </button>
                        <button type="button" disabled={col.id === 'done'} onClick={() => move(m.id, 1)} className="rounded p-1 hover:bg-slate-200 disabled:opacity-20 dark:hover:bg-white/10" aria-label={`Move "${m.title}" forward`}>
                          <ChevronRight className="size-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
