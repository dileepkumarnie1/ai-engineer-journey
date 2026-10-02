import { flashcards, getModule } from '@/content';
import type { LearningModule } from '@/content/schema';
import type { ModuleProgress, ReviewCard } from '@/db/db';
import type { ISODate } from './dates';
import { authoredQuestion, flowQuestion, MASTERY, type Question, type Rng } from './quiz';

export { BOX_DAYS, gradeCard, isRecallKey } from './leitner';

export const RECALL_LIMIT = 12;
export const NEW_FLASH_PER_DAY = 3;

export type RecallItem = { id: string; source: string } & (
  | { kind: 'question'; question: Question }
  | { kind: 'flash'; q: string; a: string }
);

export const resolveCard = (id: string, rng: Rng = Math.random): RecallItem | null => {
  const [type = '', a = '', b = ''] = id.split(':');
  if (type === 'f') {
    const f = flashcards[Number(a)];
    return f ? { id, source: 'Interview deck', kind: 'flash', q: f.q, a: f.a } : null;
  }
  const m = getModule(a);
  if (!m) return null;
  const question = type === 'q' ? authoredQuestion(m, Number(b), rng) : type === 'flow' ? flowQuestion(m, rng) : undefined;
  return question ? { id, source: m.title, kind: 'question', question } : null;
};

export const dueCards = (cards: ReviewCard[], today: ISODate) =>
  cards.filter((c) => c.due <= today).sort((x, y) => x.due.localeCompare(y.due) || x.box - y.box);

/** Card ids for today's session: due cards first, then a few new interview flashcards once unlocked. */
export const recallQueue = (cards: ReviewCard[], today: ISODate, flashUnlocked: boolean): string[] => {
  const due = dueCards(cards, today)
    .map((c) => c.id)
    .filter((id) => resolveCard(id) !== null);
  if (!flashUnlocked) return due.slice(0, RECALL_LIMIT);
  const known = new Set(cards.map((c) => c.id));
  const introducedToday = cards.filter((c) => c.id.startsWith('f:') && c.reviews === 1 && c.lastReviewed === today).length;
  const fresh = flashcards
    .map((_, i) => `f:${i}`)
    .filter((id) => !known.has(id))
    .slice(0, Math.max(0, NEW_FLASH_PER_DAY - introducedToday));
  return [...due, ...fresh].slice(0, RECALL_LIMIT);
};

export const nextDueDate = (cards: ReviewCard[], today: ISODate): ISODate | undefined =>
  cards
    .map((c) => c.due)
    .filter((d) => d > today)
    .sort()[0];

export interface WeakSpot {
  module: LearningModule;
  reasons: string[];
  severity: number;
}

export const weakSpots = (
  modules: LearningModule[],
  mp: Map<string, ModuleProgress>,
  cards: ReviewCard[],
  limit = 3,
): WeakSpot[] => {
  const lapses = new Map<string, number>();
  for (const c of cards) {
    const [type, moduleId] = c.id.split(':');
    if ((type === 'q' || type === 'flow') && moduleId) lapses.set(moduleId, (lapses.get(moduleId) ?? 0) + c.lapses);
  }
  return modules
    .flatMap((m) => {
      const p = mp.get(m.id);
      const reasons: string[] = [];
      let severity = 0;
      if (p?.quizScore !== undefined && p.quizScore < MASTERY.quiz) {
        reasons.push(`Quiz best ${p.quizScore}%`);
        severity += (MASTERY.quiz - p.quizScore) / 10;
      }
      if (p?.confidence !== undefined && p.confidence < MASTERY.confidence) {
        reasons.push('Low confidence');
        severity += MASTERY.confidence - p.confidence + 1;
      }
      const l = lapses.get(m.id) ?? 0;
      if (l >= 2) {
        reasons.push(`Missed ${l}× in recall`);
        severity += l;
      }
      return reasons.length ? [{ module: m, reasons, severity }] : [];
    })
    .sort((a, b) => b.severity - a.severity)
    .slice(0, limit);
};
