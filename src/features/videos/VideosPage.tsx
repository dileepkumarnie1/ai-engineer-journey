import { Check, Eye } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { YouTubeEmbed } from '@/components/YouTubeEmbed';
import { Card, PageHeader, ProgressBar } from '@/components/ui';
import { courseLibrary, getPhaseOfModule, phases } from '@/content';
import { toggleWatched } from '@/db/actions';
import { useWatchedSet } from '@/db/hooks';
import { cn } from '@/lib/cn';
import { hues } from '@/lib/colors';

const PINNED = ['baraa-roadmap', 'babbar-roadmap'];
const videos = courseLibrary.filter((e) => e.course.youtubeId);

function WatchButton({ id, watched }: { id: string; watched: boolean }) {
  return (
    <button
      type="button"
      onClick={() => toggleWatched(id)}
      aria-pressed={watched}
      className={cn(
        'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium',
        watched ? 'bg-emerald-500 text-white' : 'border border-slate-300 dark:border-white/15',
      )}
    >
      {watched ? <Check className="size-3.5" /> : <Eye className="size-3.5" />} {watched ? 'Watched' : 'Mark watched'}
    </button>
  );
}

export default function VideosPage() {
  const watched = useWatchedSet();
  const [phase, setPhase] = useState<string | null>(null);
  const pinned = videos.filter((v) => PINNED.includes(v.course.id));
  const rest = videos.filter(
    (v) => !PINNED.includes(v.course.id) && (!phase || v.modules.some((m) => getPhaseOfModule(m.id)?.id === phase)),
  );
  const watchedCount = videos.filter((v) => watched.has(v.course.id)).length;

  return (
    <div className="space-y-6">
      <PageHeader icon="Video" title="Video hub" subtitle="Hand-picked, free, highly visual explainers" gradient="from-rose-500 to-orange-500">
        <div className="w-56">
          <p className="mb-1 text-right text-sm font-medium">{watchedCount}/{videos.length} watched</p>
          <ProgressBar value={watchedCount / videos.length} label="Videos watched" />
        </div>
      </PageHeader>

      <section>
        <h2 className="mb-3 text-lg font-semibold">📌 Your roadmap videos</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {pinned.map(({ course }) => (
            <Card key={course.id} className="space-y-3">
              <YouTubeEmbed id={course.youtubeId!} title={course.title} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{course.title}</p>
                  <p className="text-xs text-slate-500">{course.provider}</p>
                </div>
                <WatchButton id={course.id} watched={watched.has(course.id)} />
              </div>
            </Card>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setPhase(null)} className={cn('rounded-full border px-3 py-1 text-xs', !phase ? 'border-violet-500 bg-violet-500 text-white' : 'border-slate-300 dark:border-white/15')}>
          All
        </button>
        {phases.map((p) => (
          <button key={p.id} type="button" onClick={() => setPhase(p.id)} className={cn('rounded-full border px-3 py-1 text-xs', phase === p.id ? 'border-violet-500 bg-violet-500 text-white' : 'border-slate-300 dark:border-white/15')}>
            {p.title}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {rest.map(({ course, modules }) => {
          const ph = getPhaseOfModule(modules[0]!.id)!;
          return (
            <Card key={course.id} className="space-y-3 p-3">
              <YouTubeEmbed id={course.youtubeId!} title={course.title} />
              <div className="px-1">
                <span className={cn('text-[11px] font-semibold', hues[ph.hue].text)}>{ph.title}</span>
                <p className="font-semibold leading-snug">{course.title}</p>
                <p className="text-xs text-slate-500">{course.provider} · {course.hours < 1 ? `${Math.round(course.hours * 60)} min` : `${course.hours} h`}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Link to={`/module/${modules[0]!.id}`} className="truncate text-xs text-violet-500 hover:underline">{modules[0]!.title} →</Link>
                  <WatchButton id={course.id} watched={watched.has(course.id)} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
