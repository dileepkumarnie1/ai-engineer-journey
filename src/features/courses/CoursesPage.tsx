import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CourseCard } from '@/components/CourseCard';
import { Card, PageHeader } from '@/components/ui';
import { courseFormats, type CourseFormat } from '@/content/formats';
import { courseLibrary, getPhaseOfModule, phases } from '@/content';
import { useJourney } from '@/hooks/useJourney';
import { cn } from '@/lib/cn';
import { formatMeta } from '@/lib/formats';
import { courseCompletion } from '@/lib/progress';
import { engagementScore, sortCourses, type CourseSort } from '@/lib/scoring';

const chip = (active: boolean) =>
  cn(
    'rounded-full border px-3 py-1 text-xs font-medium transition',
    active ? 'border-violet-500 bg-violet-500 text-white' : 'border-slate-300 hover:bg-slate-100 dark:border-white/15 dark:hover:bg-white/5',
  );

export default function CoursesPage() {
  const j = useJourney();
  const [q, setQ] = useState('');
  const [phase, setPhase] = useState<string | null>(null);
  const [format, setFormat] = useState<CourseFormat | null>(null);
  const [certOnly, setCertOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const [sort, setSort] = useState<CourseSort>('engagement');

  const selectedAnywhere = useMemo(
    () => new Set([...j.mp.values()].flatMap((p) => p.selectedCourseIds)),
    [j.mp],
  );

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = courseLibrary.filter(({ course, modules }) => {
      if (phase && !modules.some((m) => getPhaseOfModule(m.id)?.id === phase)) return false;
      if (format && course.format !== format) return false;
      if (certOnly && !course.certificate) return false;
      if (freeOnly && course.paid) return false;
      if (needle && !`${course.title} ${course.provider} ${course.pitch}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    const order = sortCourses(filtered.map((e) => e.course), sort);
    return order.map((c) => filtered.find((e) => e.course.id === c.id)!);
  }, [q, phase, format, certOnly, freeOnly, sort]);

  const totalHours = Math.round(courseLibrary.reduce((s, e) => s + e.course.hours, 0));
  const engaging = courseLibrary.filter((e) => engagementScore(e.course) >= 80).length;

  return (
    <div>
      <PageHeader icon="GraduationCap" title="Course library" subtitle="Hand-picked, community-favourite resources — free unless marked Paid. Add them to your plan from any module page." />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {[
          ['📚', courseLibrary.length, 'resources'],
          ['🎬', courseLibrary.filter((e) => e.course.youtubeId).length, 'embedded videos'],
          ['✨', engaging, 'highly engaging'],
          ['⏱', `${totalHours} h`, 'of content'],
        ].map(([e, v, l]) => (
          <Card key={String(l)} className="text-center">
            <p className="text-3xl">{e}</p>
            <p className="text-2xl font-bold">{v}</p>
            <p className="text-xs text-slate-500">{l}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-6 space-y-3">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5">
          <Search className="size-4 text-slate-400" aria-hidden />
          <span className="sr-only">Search courses</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search RAG, LangGraph, Karpathy…"
            className="w-full bg-transparent text-sm outline-none"
            maxLength={80}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip(phase === null)} onClick={() => setPhase(null)}>All phases</button>
          {phases.map((p) => (
            <button key={p.id} type="button" className={chip(phase === p.id)} onClick={() => setPhase(p.id)}>
              P{p.order} {p.title}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={chip(format === null)} onClick={() => setFormat(null)}>All formats</button>
          {courseFormats.map((f) => (
            <button key={f} type="button" className={chip(format === f)} onClick={() => setFormat(f)}>
              {formatMeta[f].label}
            </button>
          ))}
          <button type="button" className={chip(certOnly)} onClick={() => setCertOnly((v) => !v)} aria-pressed={certOnly}>
            🎓 Certificate
          </button>
          <button type="button" className={chip(freeOnly)} onClick={() => setFreeOnly((v) => !v)} aria-pressed={freeOnly}>
            🆓 Free only
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as CourseSort)}
            className="ml-auto rounded-lg border border-slate-300 bg-transparent px-2 py-1 text-xs dark:border-white/15"
            aria-label="Sort"
          >
            <option value="engagement">Most engaging</option>
            <option value="popularity">Most popular</option>
            <option value="shortest">Shortest</option>
          </select>
        </div>
      </Card>

      <p className="mb-3 text-sm text-slate-500">{list.length} results</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map(({ course, modules }) => (
          <CourseCard
            key={course.id}
            course={course}
            modules={modules}
            selected={selectedAnywhere.has(course.id)}
            progress={courseCompletion(course, j.cp)}
          />
        ))}
      </div>
    </div>
  );
}
