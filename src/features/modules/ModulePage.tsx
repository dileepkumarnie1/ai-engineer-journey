import { ArrowLeft, ArrowRight, Check, CircleDashed, ExternalLink as ExternalIcon, Play, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { useTimer } from '@/app/timer';
import { buttonStyles } from '@/components/buttonStyles';
import { CourseCard } from '@/components/CourseCard';
import { FlowDiagram } from '@/components/FlowDiagram';
import { YouTubeEmbed } from '@/components/YouTubeEmbed';
import { Badge, Button, Card, ExternalLink, Icon, ProgressBar, ProgressRing } from '@/components/ui';
import { allModules, getModule, getPhaseOfModule } from '@/content';
import { completeModule, setModuleStatus, toggleCourseSelection, toggleLesson } from '@/db/actions';
import { useJourney } from '@/hooks/useJourney';
import { cn } from '@/lib/cn';
import { hues } from '@/lib/colors';
import { formatShort } from '@/lib/dates';
import { testOutArea } from '@/lib/onboarding';
import { courseCompletion, getLessons, moduleCompletion } from '@/lib/progress';
import { MASTERY, masteryCheck } from '@/lib/quiz';
import { sortCourses, type CourseSort } from '@/lib/scoring';
import { Quiz } from './Quiz';
import { Reflection } from './Reflection';

const SORTS: { id: CourseSort; label: string }[] = [
  { id: 'engagement', label: '✨ Most engaging' },
  { id: 'popularity', label: '⭐ Most popular' },
  { id: 'shortest', label: '⚡ Shortest' },
];

export default function ModulePage() {
  const { moduleId = '' } = useParams();
  const module = getModule(moduleId);
  const phase = getPhaseOfModule(moduleId);
  const j = useJourney();
  const timer = useTimer();
  const [sort, setSort] = useState<CourseSort>('engagement');
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    // Wait a frame so the section exists before scrolling to it.
    const t = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    return () => window.clearTimeout(t);
  }, [hash, moduleId]);

  if (!module || !phase) {
    return (
      <Card className="text-center">
        <p className="text-4xl">🔍</p>
        <p className="mt-2 font-semibold">Module not found</p>
        <Link to="/roadmap" className="text-violet-500 underline">Back to roadmap</Link>
      </Card>
    );
  }

  const h = hues[phase.hue];
  const progress = j.mp.get(module.id);
  const status = progress?.status ?? 'not-started';
  const selectedIds = progress?.selectedCourseIds ?? [];
  const selected = module.courses.filter((c) => selectedIds.includes(c.id));
  const completion = moduleCompletion(module, j.mp, j.cp);
  const plan = j.plan.find((p) => p.moduleId === module.id)!;
  const idx = allModules.findIndex((m) => m.id === module.id);
  const prev = allModules[idx - 1];
  const next = allModules[idx + 1];
  const mastery = masteryCheck(progress);
  const fastTrack = module.kind === 'learn' && status !== 'done' ? testOutArea(j.settings.experience, phase.id) : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.header
        key={module.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-2xl sm:p-8', h.gradient)}
      >
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-2xl">
            <Link to={`/roadmap#${phase.id}`} className="text-sm font-medium text-white/80 hover:underline">
              ← Phase {phase.order} · {phase.title}
            </Link>
            <div className="mt-3 flex items-center gap-4">
              <div className="grid size-16 place-items-center rounded-2xl bg-white/20 animate-float">
                <Icon name={module.icon} className="size-8" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{module.title}</h1>
                <p className="text-white/90">{module.tagline}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="bg-white/20 text-white">📅 {formatShort(plan.startDate)} → {formatShort(plan.endDate)}</Badge>
              <Badge className="bg-white/20 text-white">⏱ {module.studyDays} × {j.settings.minutesPerDay} min</Badge>
              {module.kind === 'project' && <Badge className="bg-white/20 text-white">🛠 Project module</Badge>}
            </div>
          </div>
          <ProgressRing value={completion} size={120} stroke={11} color="#fff" label={`${Math.round(completion * 100)}% complete`}>
            <div>
              <p className="text-2xl font-extrabold">{Math.round(completion * 100)}%</p>
              <p className="text-[11px] capitalize text-white/80">{status.replace('-', ' ')}</p>
            </div>
          </ProgressRing>
        </div>
      </motion.header>

      {fastTrack && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-400/50 bg-amber-500/10 p-4 text-sm">
          <span className="text-2xl" aria-hidden>⚡</span>
          <p className="flex-1">
            <span className="font-semibold">Fast-track available.</span> You rated yourself solid in {fastTrack.emoji} {fastTrack.label}. Skip the
            courses if you like: pass the mastery check and rate your confidence to complete this module.
          </p>
          <a href="#quiz" className={buttonStyles('outline', 'sm')}>Test out now</a>
        </div>
      )}

      {/* In pictures */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold">🖼 In pictures</h2>
        <FlowDiagram steps={module.flow} dotClass={h.dot} />
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {module.cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={cn('rounded-2xl border p-4', h.border, h.soft)}
            >
              <div className={cn('mb-3 grid size-12 place-items-center rounded-xl bg-gradient-to-br text-white', h.gradient)}>
                <Icon name={c.icon} className="size-6" />
              </div>
              <p className="font-semibold">{c.title}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{c.text}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-4 rounded-2xl bg-slate-900 p-4 text-white dark:bg-white/10">
          <div className="flex shrink-0 items-center gap-1">
            <span className="grid size-10 place-items-center rounded-xl bg-sky-500"><Icon name="Database" className="size-5" /></span>
            <ArrowRight className="size-4" aria-hidden />
            <span className="grid size-10 place-items-center rounded-xl bg-violet-500"><Icon name="Bot" className="size-5" /></span>
          </div>
          <p className="text-sm"><span className="font-semibold">Your ETL bridge: </span>{module.bridge}</p>
        </div>
        {module.tip && (
          <p className="mt-3 rounded-xl bg-amber-500/15 p-3 text-sm text-amber-800 dark:text-amber-200">💡 {module.tip}</p>
        )}
      </Card>

      {/* Course picker */}
      <section aria-labelledby="pick">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="pick" className="scroll-mt-24 text-lg font-semibold">🎯 Pick your learning</h2>
            <p className="text-sm text-slate-500">Free unless marked Paid. Ranked by engagement (interactive + visual + hands-on + popular). Add one or more to your plan.</p>
          </div>
          <div className="flex gap-1 rounded-xl bg-slate-200/60 p-1 dark:bg-white/5" role="tablist" aria-label="Sort courses">
            {SORTS.map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={sort === s.id}
                onClick={() => setSort(s.id)}
                className={cn('rounded-lg px-3 py-1.5 text-xs font-medium', sort === s.id ? 'bg-white shadow dark:bg-white/15' : 'text-slate-500')}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        {selected.length === 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border-2 border-dashed border-violet-400/60 bg-violet-500/10 p-4 text-sm">
            <span className="text-2xl" aria-hidden>👇</span>
            <p>
              <span className="font-bold">Step 1:</span> tap <span className="font-semibold">“Add to my plan”</span> on a course — the ⭐ one is our pick.{' '}
              <span className="font-bold">Step 2:</span> your lesson checklist appears below; press <span className="font-semibold">Start focus session</span> and learn.
            </p>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sortCourses(module.courses, sort).map((c, i) => (
            <CourseCard
              key={c.id}
              course={c}
              recommended={sort === 'engagement' && i === 0}
              selected={selectedIds.includes(c.id)}
              progress={courseCompletion(c, j.cp)}
              onToggle={() => toggleCourseSelection(module.id, c.id)}
            />
          ))}
        </div>
      </section>

      {/* My plan */}
      <Card id="my-plan" className="scroll-mt-24">
        <h2 className="mb-1 text-lg font-semibold">📋 My plan for this module</h2>
        {selected.length === 0 ? (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-white/15">
            <CircleDashed className="size-5" aria-hidden /> Add at least one course above to start tracking lessons.
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {selected.map((c) => {
              const lessons = getLessons(c);
              const done = new Set(j.cp.get(c.id)?.lessonsDone ?? []);
              const nextIdx = lessons.findIndex((_, i) => !done.has(i));
              return (
                <div key={c.id} className="grid gap-4 lg:grid-cols-5">
                  {c.youtubeId && (
                    <div className="lg:col-span-2">
                      <YouTubeEmbed id={c.youtubeId} title={c.title} />
                    </div>
                  )}
                  <div className={c.youtubeId ? 'lg:col-span-3' : 'lg:col-span-5'}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="font-semibold">{c.title}</p>
                      <ExternalLink href={c.url} className="inline-flex items-center gap-1 text-sm text-violet-500 hover:underline">
                        Open <ExternalIcon className="size-3.5" />
                      </ExternalLink>
                    </div>
                    <ProgressBar value={courseCompletion(c, j.cp)} barClassName="bg-emerald-500" label={`${c.title} lessons`} />
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {lessons.map((l, i) => (
                        <li key={l}>
                          <label
                            className={cn(
                              'flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 text-sm hover:bg-slate-50 dark:hover:bg-white/5',
                              i === nextIdx ? 'border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/30' : 'border-slate-200 dark:border-white/10',
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={done.has(i)}
                              onChange={() => toggleLesson(c.id, i)}
                              className="size-4 accent-emerald-500"
                            />
                            <span className={cn('flex-1', done.has(i) && 'text-slate-400 line-through')}>{l}</span>
                            {i === nextIdx && <span className="rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-bold text-white">▶ NEXT</span>}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Build */}
      <Card className="flex flex-wrap items-center gap-4">
        <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <Icon name="Hammer" className="size-6" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">30-minute build</p>
          <p className="font-medium">{module.build}</p>
        </div>
        <Button variant="outline" onClick={() => timer.start(module.id)} disabled={timer.running}>
          <Play className="size-4" /> Start focus session
        </Button>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Quiz key={module.id} module={module} best={progress?.quizScore} />
        <Reflection moduleId={module.id} />
      </div>

      {/* Completion + nav */}
      <Card id="complete" className="flex scroll-mt-24 flex-wrap items-center justify-between gap-4">
        {status === 'done' ? (
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-emerald-500 text-white"><Check className="size-5" /></span>
            <p className="font-semibold">Module complete — nice work! 🎉</p>
            <Button variant="ghost" size="sm" onClick={() => setModuleStatus(module.id, 'in-progress')}>
              <RotateCcw className="size-4" /> Reopen
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-semibold">🎓 Mastery gate: prove it to complete it</p>
            <ul className="flex flex-wrap gap-2 text-sm">
              <li className={cn('rounded-full px-3 py-1', mastery.quizOk ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200/70 dark:bg-white/10')}>
                {mastery.quizOk ? '✅' : '⬜'} Quiz ≥ {MASTERY.quiz}%{progress?.quizScore !== undefined && ` (best ${progress.quizScore}%)`}
              </li>
              <li className={cn('rounded-full px-3 py-1', mastery.confidenceOk ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200/70 dark:bg-white/10')}>
                {mastery.confidenceOk ? '✅' : '⬜'} Confidence ≥ 🙂
              </li>
            </ul>
            <Button variant="success" disabled={!mastery.ready} onClick={() => completeModule(module.id)}>
              <Check className="size-4" /> Mark module complete
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          {prev && (
            <Link to={`/module/${prev.id}`} className={buttonStyles('outline', 'sm')}>
              <ArrowLeft className="size-4" /> {prev.title}
            </Link>
          )}
          {next && (
            <Link to={`/module/${next.id}`} className={buttonStyles('primary', 'sm')}>
              {next.title} <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
}
