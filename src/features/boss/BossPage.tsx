import { ArrowRight, Download, Lock, Swords } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { buttonStyles } from '@/components/buttonStyles';
import { QuestionView } from '@/components/QuestionView';
import { Button, Card, Icon } from '@/components/ui';
import { getPhase } from '@/content';
import { recordBoss, reviewRecallCard } from '@/db/actions';
import { useJourney } from '@/hooks/useJourney';
import { downloadCertificate } from '@/lib/certificate';
import { cn } from '@/lib/cn';
import { hues } from '@/lib/colors';
import { formatShort } from '@/lib/dates';
import { XP_RULES } from '@/lib/gamification';
import { isRecallKey } from '@/lib/leitner';
import { BOSS_PASS, buildBossQuiz, isAnswered, scoreQuiz, type Answer, type Question } from '@/lib/quiz';

export default function BossPage() {
  const { phaseId = '' } = useParams();
  const phase = getPhase(phaseId);
  const j = useJourney();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!phase) {
    return (
      <Card className="text-center">
        <p className="text-4xl">🔍</p>
        <p className="mt-2 font-semibold">Phase not found</p>
        <Link to="/roadmap" className="text-violet-500 underline">Back to roadmap</Link>
      </Card>
    );
  }

  const h = hues[phase.hue];
  const result = j.bosses.get(phase.id);
  const unlocked = j.bossUnlocked(phase.id);
  const remaining = phase.modules.filter((m) => j.mp.get(m.id)?.status !== 'done');
  const certificate = (score: number, date: string) =>
    downloadCertificate({ name: j.settings.name, phaseOrder: phase.order, phaseTitle: phase.title, score, date, goal: j.settings.goal });

  const start = () => {
    setQuestions(buildBossQuiz(phase));
    setAnswers({});
    setSubmitted(false);
  };

  const scored = questions ? scoreQuiz(questions, answers) : null;
  const passed = (scored?.score ?? 0) >= BOSS_PASS;

  const submit = async () => {
    if (!questions || !scored) return;
    setSubmitted(true);
    await recordBoss(phase.id, scored.score, passed);
    // Boss answers also feed spaced repetition, so misses come back in Daily Recall.
    for (const r of scored.results.filter((x) => isRecallKey(x.key))) await reviewRecallCard(r.key, r.correct);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className={cn('relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-2xl sm:p-8', h.gradient)}>
        <Link to={`/roadmap#${phase.id}`} className="text-sm font-medium text-white/80 hover:underline">← Roadmap</Link>
        <div className="mt-3 flex items-center gap-4">
          <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="grid size-16 place-items-center rounded-2xl bg-white/20">
            <Swords className="size-8" aria-hidden />
          </motion.div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">Phase {phase.order} boss</p>
            <h1 className="text-3xl font-extrabold tracking-tight">{phase.title}</h1>
            <p className="text-white/90">{phase.goal}</p>
          </div>
        </div>
      </header>

      {!unlocked ? (
        <Card className="space-y-4">
          <p className="flex items-center gap-2 text-lg font-semibold"><Lock className="size-5" aria-hidden /> Master every module in this phase to face the boss</p>
          <ul className="space-y-2">
            {remaining.map((m) => (
              <li key={m.id}>
                <Link to={`/module/${m.id}`} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
                  <Icon name={m.icon} className="size-4" /> <span className="flex-1">{m.title}</span> <ArrowRight className="size-4" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : !questions ? (
        <Card className="space-y-4 text-center">
          {result?.passedAt ? (
            <>
              <p className="text-5xl" aria-hidden>🏆</p>
              <p className="text-xl font-bold">Defeated on {formatShort(result.passedAt)} · best {result.best}%</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => certificate(result.best, result.passedAt!)}><Download className="size-4" /> Download certificate</Button>
                <Button variant="outline" onClick={start}>Fight again (practice)</Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-5xl" aria-hidden>⚔️</p>
              <p className="text-xl font-bold">A mixed exam across the whole phase</p>
              <p className="text-sm text-slate-500">
                Up to 9 questions from every module. Score {BOSS_PASS}% to earn the Boss slayer badge, +{XP_RULES.boss} XP and a certificate.
                {result && ` Your best so far: ${result.best}%.`}
              </p>
              <Button onClick={start} className="mx-auto">Face the boss <ArrowRight className="size-4" /></Button>
            </>
          )}
        </Card>
      ) : (
        <Card className="space-y-5">
          {questions.map((q, i) => (
            <QuestionView
              key={q.key}
              number={i + 1}
              question={q}
              value={answers[q.key]}
              revealed={submitted}
              onChange={(a) => setAnswers((prev) => ({ ...prev, [q.key]: a }))}
            />
          ))}
          {submitted && scored ? (
            <div className={cn('space-y-3 rounded-2xl p-4 text-center', passed ? 'bg-emerald-500/15' : 'bg-amber-500/15')} role="status">
              <p className="text-4xl" aria-hidden>{passed ? '🏆' : '🛡️'}</p>
              <p className="text-xl font-bold">{passed ? `Boss defeated! ${scored.score}%` : `${scored.score}%: so close. You need ${BOSS_PASS}%.`}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {passed ? 'Your certificate is ready.' : 'Read the explanations above; missed questions are now in your Daily Recall.'}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {passed && (
                  <Button onClick={() => certificate(scored.score, j.today)}><Download className="size-4" /> Download certificate</Button>
                )}
                <Button variant="outline" onClick={start}>{passed ? 'Practice again' : 'Retry'}</Button>
                <Link to="/roadmap" className={buttonStyles('ghost')}>Back to roadmap</Link>
              </div>
            </div>
          ) : (
            <Button onClick={submit} disabled={!questions.every((q) => isAnswered(q, answers[q.key]))}>Submit answers</Button>
          )}
        </Card>
      )}
    </div>
  );
}
