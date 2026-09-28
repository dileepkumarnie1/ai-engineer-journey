import { Check, ExternalLink as ExternalIcon, Plus, Star } from 'lucide-react';
import { Link } from 'react-router';
import type { Course, LearningModule } from '@/content/schema';
import { cn } from '@/lib/cn';
import { formatMeta, ytThumb } from '@/lib/formats';
import { engagementLabel, engagementScore } from '@/lib/scoring';
import { Badge, Button, ExternalLink, Icon } from './ui';

interface Props {
  course: Course;
  selected?: boolean;
  onToggle?: () => void;
  modules?: LearningModule[];
  progress?: number;
}

export function CourseCard({ course, selected, onToggle, modules, progress }: Props) {
  const score = engagementScore(course);
  const fmt = formatMeta[course.format];

  return (
    <article
      className={cn(
        'glass flex flex-col overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-xl',
        selected && 'ring-2 ring-violet-500',
      )}
    >
      <div className="relative aspect-[16/8] overflow-hidden">
        {course.youtubeId ? (
          <img src={ytThumb(course.youtubeId)} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <div className={cn('grid size-full place-items-center bg-gradient-to-br text-white', fmt.gradient)}>
            <Icon name={fmt.icon} className="size-12 opacity-90 animate-float" />
          </div>
        )}
        <div className="absolute left-2 top-2 flex gap-1">
          <Badge className="bg-black/60 text-white backdrop-blur">
            <Icon name={fmt.icon} className="size-3" /> {fmt.label}
          </Badge>
          <Badge className="bg-black/60 text-white backdrop-blur">
            {course.hours < 1 ? `${Math.round(course.hours * 60)} min` : `${course.hours} h`}
          </Badge>
        </div>
        <div
          className="absolute right-2 top-2 grid size-11 place-items-center rounded-full bg-black/70 text-sm font-bold text-white backdrop-blur"
          title={`Engagement score: ${score}/100`}
        >
          {score}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold leading-snug">{course.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{course.provider}</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300">{course.pitch}</p>

        <div className="flex flex-wrap gap-1">
          {course.paid ? (
            <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300">💳 Paid</Badge>
          ) : (
            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Free</Badge>
          )}
          {course.interactivity >= 4 && <Badge className="bg-violet-500/15 text-violet-700 dark:text-violet-300">🎮 Interactive</Badge>}
          {course.visual >= 4 && <Badge className="bg-pink-500/15 text-pink-700 dark:text-pink-300">🎨 Visual</Badge>}
          {course.handsOn >= 4 && <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300">🛠 Hands-on</Badge>}
          {course.certificate && <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300">🎓 Certificate</Badge>}
        </div>

        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-500 dark:text-slate-400">{engagementLabel(score)}</span>
          <span className="flex" aria-label={`Popularity ${course.popularity} of 5`}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                aria-hidden
                className={cn('size-3.5', i < course.popularity ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600')}
              />
            ))}
          </span>
        </div>

        {progress !== undefined && selected && (
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div className="h-full bg-emerald-500" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        )}

        {modules && modules.length > 0 && (
          <div className="flex flex-wrap gap-1 text-xs">
            {modules.map((m) => (
              <Link key={m.id} to={`/module/${m.id}`} className="rounded-md bg-slate-100 px-2 py-0.5 hover:underline dark:bg-white/10">
                {m.title}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-auto flex gap-2 pt-2">
          {onToggle && (
            <Button size="sm" variant={selected ? 'success' : 'primary'} onClick={onToggle} aria-pressed={selected} className="flex-1">
              {selected ? <Check className="size-4" /> : <Plus className="size-4" />}
              {selected ? 'In my plan' : 'Add to my plan'}
            </Button>
          )}
          <ExternalLink
            href={course.url}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-white dark:border-white/15 dark:hover:bg-white/10"
          >
            Open <ExternalIcon className="size-3.5" />
          </ExternalLink>
        </div>
      </div>
    </article>
  );
}
