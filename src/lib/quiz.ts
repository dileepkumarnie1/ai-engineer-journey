import type { LearningModule, Phase } from '@/content/schema';
import type { ModuleProgress } from '@/db/db';

export type Rng = () => number;

export interface McqQuestion {
  key: string;
  kind: 'mcq';
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export interface OrderQuestion {
  key: string;
  kind: 'order';
  q: string;
  /** Correct order. */
  steps: string[];
  /** Order the chips are first shown in. */
  shuffled: string[];
  why: string;
}

export type Question = McqQuestion | OrderQuestion;
export type Answer = number | string[];

export const MASTERY = { quiz: 70, confidence: 3 } as const;

/** Deterministic RNG (mulberry32) so a given seed always shuffles the same way. */
export const seededRng = (seed: string): Rng => {
  let a = 0;
  for (let i = 0; i < seed.length; i++) a = Math.imul(a ^ seed.charCodeAt(i), 2654435761);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const shuffle = <T>(items: readonly T[], rng: Rng = Math.random): T[] => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
};

const shuffleMcq = (q: McqQuestion, rng: Rng): McqQuestion => {
  const order = shuffle(q.options.map((_, i) => i), rng);
  return { ...q, options: order.map((i) => q.options[i]!), answer: order.indexOf(q.answer) };
};

/** Never show an ordering puzzle already in the right order. */
const shuffledSteps = (steps: string[], rng: Rng): string[] => {
  for (let tries = 0; tries < 5; tries++) {
    const s = shuffle(steps, rng);
    if (s.some((x, i) => x !== steps[i])) return s;
  }
  return [...steps].reverse();
};

export const flowQuestion = (m: LearningModule, rng: Rng = Math.random): OrderQuestion => ({
  key: `flow:${m.id}`,
  kind: 'order',
  q: `Put the “${m.title}” flow in order`,
  steps: m.flow,
  shuffled: shuffledSteps(m.flow, rng),
  why: m.flow.join(' → '),
});

const cardQuestion = (m: LearningModule, rng: Rng): McqQuestion => {
  const idx = Math.floor(rng() * m.cards.length);
  const card = m.cards[idx]!;
  return shuffleMcq(
    {
      key: `card:${m.id}`,
      kind: 'mcq',
      q: `Which idea is this? “${card.text}”`,
      options: m.cards.map((c) => c.title),
      answer: idx,
      why: `${card.title}: ${card.text}`,
    },
    rng,
  );
};

export const authoredQuestion = (m: LearningModule, i: number, rng: Rng = Math.random): McqQuestion | undefined => {
  const q = m.quiz[i];
  return q && shuffleMcq({ key: `q:${m.id}:${i}`, kind: 'mcq', ...q }, rng);
};

/** Authored questions + a concept-match and a flow-ordering question, options shuffled each attempt. */
export const buildQuiz = (m: LearningModule, rng: Rng = Math.random): Question[] => [
  ...m.quiz.map((_, i) => authoredQuestion(m, i, rng)!),
  cardQuestion(m, rng),
  flowQuestion(m, rng),
];

export const isCorrect = (q: Question, a: Answer | undefined): boolean =>
  q.kind === 'mcq' ? a === q.answer : Array.isArray(a) && a.length === q.steps.length && a.every((s, i) => s === q.steps[i]);

export const isAnswered = (q: Question, a: Answer | undefined): boolean =>
  q.kind === 'mcq' ? typeof a === 'number' : Array.isArray(a) && a.length === q.steps.length;

export const scoreQuiz = (questions: Question[], answers: Record<string, Answer>) => {
  const results = questions.map((q) => ({ key: q.key, correct: isCorrect(q, answers[q.key]) }));
  const correct = results.filter((r) => r.correct).length;
  return { results, correct, score: Math.round((correct / questions.length) * 100) };
};

export const masteryCheck = (p: ModuleProgress | undefined) => {
  const quizOk = (p?.quizScore ?? -1) >= MASTERY.quiz;
  const confidenceOk = (p?.confidence ?? 0) >= MASTERY.confidence;
  return { quizOk, confidenceOk, ready: quizOk && confidenceOk };
};

export const BOSS_PASS = 80;
export const BOSS_QUESTIONS = 8;

/** Mixed exam across a whole phase: up to 8 authored questions plus one flow puzzle. */
export const buildBossQuiz = (phase: Phase, rng: Rng = Math.random): Question[] => {
  const pool = phase.modules.flatMap((m) => m.quiz.map((_, i) => authoredQuestion(m, i, rng)!));
  const flowModule = phase.modules[Math.floor(rng() * phase.modules.length)]!;
  return [...shuffle(pool, rng).slice(0, BOSS_QUESTIONS), flowQuestion(flowModule, rng)];
};
